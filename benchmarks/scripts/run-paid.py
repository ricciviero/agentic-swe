#!/usr/bin/env python3
"""Run paid BehaviorBench trials serially with live DeepSeek budget gates."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import ssl
import subprocess
import sys
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]


def tls_context() -> ssl.SSLContext:
    """Use an explicit CA bundle when framework Python has no configured one."""
    configured = os.environ.get("SSL_CERT_FILE")
    fallback = Path("/etc/ssl/cert.pem")
    cafile = configured or (str(fallback) if fallback.is_file() else None)
    return ssl.create_default_context(cafile=cafile)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def deepseek_balance(api_key: str) -> float:
    request = urllib.request.Request(
        "https://api.deepseek.com/user/balance",
        headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=30, context=tls_context()) as response:
        payload = json.load(response)
    if not payload.get("is_available"):
        raise RuntimeError("DeepSeek balance is unavailable")
    for balance in payload.get("balance_infos") or []:
        if balance.get("currency") == "USD":
            return float(balance["total_balance"])
    raise RuntimeError("DeepSeek did not return a USD balance")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def task_paths(task_ids: list[str] | None) -> list[Path]:
    manifest = load_json(ROOT / "benchmarks/harbor/datasets/agentic-swe-behavior/manifest.json")
    available = [task["id"] for task in manifest["tasks"]]
    selected = task_ids or available
    unknown = sorted(set(selected) - set(available))
    if unknown:
        raise ValueError(f"Unknown task IDs: {unknown}")
    return [ROOT / "benchmarks/harbor/datasets/agentic-swe-behavior/tasks" / task for task in selected]


def find_job_result(job_root: Path) -> dict[str, Any]:
    candidates = sorted(job_root.glob("*/result.json"))
    if len(candidates) != 1:
        raise RuntimeError(f"Expected one Harbor job result under {job_root}, found {len(candidates)}")
    return load_json(candidates[0])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", choices=("pilot", "confirmatory"), required=True)
    parser.add_argument("--interference-tarball", required=True, type=Path)
    parser.add_argument("--task", action="append", dest="tasks")
    parser.add_argument("--replicas", type=int)
    parser.add_argument("--auth-file", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    arguments = parser.parse_args()

    lock = load_json(ROOT / "benchmarks/benchmark-lock.json")
    arms = load_json(ROOT / "benchmarks/arms.json")
    budget = lock["budget"]
    if not budget.get("paidCallsAllowed") and not arguments.dry_run:
        raise SystemExit("Paid calls are locked; complete offline gates and seal benchmark-lock.json first")
    if arms["model"] != f"{lock['model']['provider']}/{lock['model']['id']}":
        raise SystemExit("Model mismatch between arms.json and benchmark-lock.json")
    if arms["reasoningEffort"] != lock["model"]["reasoningEffort"]:
        raise SystemExit("Reasoning mismatch between arms.json and benchmark-lock.json")

    archive = arguments.interference_tarball.resolve()
    digest = sha256(archive)
    locked_digest = lock["repositories"]["interference"].get("artifactSha256")
    if locked_digest and locked_digest != digest:
        raise SystemExit("Interference artifact digest does not match the lock")
    if not locked_digest and not arguments.dry_run:
        raise SystemExit("Interference artifact digest has not been sealed")

    replicas = arguments.replicas
    if replicas is None:
        key = "pilotReplicasPerTreatment" if arguments.phase == "pilot" else "confirmatoryReplicasPerTreatment"
        replicas = lock["analysis"].get(key)
    if not isinstance(replicas, int) or replicas <= 0:
        raise SystemExit("A positive locked or explicit replica count is required")

    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key and arguments.auth_file:
        auth = load_json(arguments.auth_file.expanduser())
        candidate = auth.get("deepseek")
        if isinstance(candidate, str):
            api_key = candidate
    if not api_key and not arguments.dry_run:
        raise SystemExit("DEEPSEEK_API_KEY or --auth-file with a DeepSeek key is required")
    jobs_root = ROOT / "benchmarks/jobs" / f"{lock['experimentId']}-{arguments.phase}"
    jobs_root.mkdir(parents=True, exist_ok=True)
    state_path = jobs_root / "budget-state.json"
    if state_path.exists():
        state = load_json(state_path)
    else:
        starting = deepseek_balance(api_key) if api_key else float(budget["observedBalanceUsd"])
        state = {"startingBalanceUsd": starting, "lastBalanceUsd": starting, "trials": []}
        state_path.write_text(json.dumps(state, indent=2) + "\n")

    schedule = [
        (task, arm, replica)
        for replica in range(replicas)
        for task in task_paths(arguments.tasks)
        for arm in arms["arms"]
    ]
    random.Random(int(lock["analysis"]["randomizationSeed"])).shuffle(schedule)

    for task, arm, replica in schedule:
        trial_key = f"{task.name}:{arm['treatment']}:{replica + 1}"
        if any(item["key"] == trial_key for item in state["trials"]):
            continue
        current = deepseek_balance(api_key) if api_key else state["lastBalanceUsd"]
        spent = max(0.0, float(state["startingBalanceUsd"]) - current)
        allowance = float(budget["perTrialAllowanceUsd"])
        if spent + allowance > float(budget["hardCapUsd"]):
            raise SystemExit(f"Budget gate stopped before {trial_key}: spent ${spent:.4f}")

        output = jobs_root / trial_key.replace(":", "__")
        command = [
            "harbor", "run", "-p", str(task),
            "-a", arms["agentImportPath"],
            "-m", arms["model"],
            "--ak", f"treatment={arm['treatment']}",
            "--ak", f"interference_tarball={archive}",
            "--ak", f"interference_sha256={digest}",
            "--ak", f"reasoning_effort={arms['reasoningEffort']}",
            "--ak", f"max_cost_usd={arms['maxCostUsd']}",
            "--ak", f"max_output_tokens={arms['maxOutputTokens']}",
            "--ak", f"max_steps={arms['maxSteps']}",
            "--ak", f"max_continuations={arms['maxContinuations']}",
            "--n-concurrent", "1", "-q", "-y",
            "-o", str(output), "--job-name", "run",
        ]
        print(f"{arguments.phase}: {trial_key} (spent before trial ${spent:.4f})", flush=True)
        if arguments.dry_run:
            continue
        environment = os.environ.copy()
        environment["PYTHONPATH"] = str(ROOT)
        environment["DEEPSEEK_API_KEY"] = api_key
        completed = subprocess.run(command, cwd=ROOT, env=environment, check=False)
        if completed.returncode != 0:
            raise RuntimeError(f"Harbor exited {completed.returncode} for {trial_key}")
        result = find_job_result(output)
        if result["stats"]["n_errored_trials"] or result["stats"]["n_completed_trials"] != 1:
            raise RuntimeError(f"Harbor trial did not complete cleanly: {trial_key}")
        after = deepseek_balance(api_key)
        state["lastBalanceUsd"] = after
        state["trials"].append({
            "key": trial_key,
            "balanceBeforeUsd": current,
            "balanceAfterUsd": after,
            "costByBalanceUsd": max(0.0, current - after),
            "artifactSha256": digest,
        })
        state_path.write_text(json.dumps(state, indent=2) + "\n")
        total_spent = max(0.0, float(state["startingBalanceUsd"]) - after)
        if total_spent > float(budget["hardCapUsd"]):
            raise RuntimeError(f"Budget cap exceeded after bounded trial: ${total_spent:.4f}")

    if not arguments.dry_run:
        print(f"Completed {len(state['trials'])} paid trials; tracked spend ${float(state['startingBalanceUsd']) - float(state['lastBalanceUsd']):.4f}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
