#!/usr/bin/env python3
"""Run a sealed BehaviorBench confirmatory schedule with live budget gates."""

from __future__ import annotations

import argparse
import json
import os
import random
import ssl
import subprocess
import sys
import urllib.request
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from benchmarks.scripts.confirmatory_lock import (
    EXPERIMENT,
    LOCK_PATH,
    computed_seal,
    digest,
    load_json,
)


ROOT = Path(__file__).resolve().parents[2]
ARMS_PATH = EXPERIMENT / "arms.json"
DATASET = ROOT / "benchmarks/harbor/datasets/agentic-swe-behavior-v2"


def tls_context() -> ssl.SSLContext:
    configured = os.environ.get("SSL_CERT_FILE")
    fallback = Path("/etc/ssl/cert.pem")
    cafile = configured or (str(fallback) if fallback.is_file() else None)
    return ssl.create_default_context(cafile=cafile)


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


def schedule_trials(lock: dict[str, Any], arms: dict[str, Any]) -> list[tuple[str, dict[str, str], int]]:
    replicas = int(lock["analysis"]["replicasPerTreatment"])
    schedule = [
        (task_id, arm, replica)
        for replica in range(1, replicas + 1)
        for task_id in lock["dataset"]["includedTaskIds"]
        for arm in arms["arms"]
    ]
    random.Random(int(lock["analysis"]["randomizationSeed"])).shuffle(schedule)
    return schedule


def budget_allows(start: float, current: float, cap: float, allowance: float) -> bool:
    spent = max(0.0, start - current)
    return spent + allowance <= cap


def next_attempt(state: dict[str, Any], trial_key: str) -> int:
    prior = [item for item in state.get("errors", []) if item.get("key") == trial_key]
    return len(prior) + 1


def find_job_result(job_root: Path) -> dict[str, Any]:
    candidates = sorted(job_root.glob("*/result.json"))
    if len(candidates) != 1:
        raise RuntimeError(f"Expected one Harbor job result under {job_root}, found {len(candidates)}")
    return load_json(candidates[0])


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.write_text(json.dumps(state, indent=2) + "\n")


def load_api_key(auth_file: Path | None, dry_run: bool) -> str | None:
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key and auth_file:
        auth = load_json(auth_file.expanduser())
        candidate = auth.get("deepseek")
        if isinstance(candidate, str):
            api_key = candidate
    if not api_key and not dry_run:
        raise SystemExit("DEEPSEEK_API_KEY or --auth-file with a DeepSeek key is required")
    return api_key


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--interference-tarball", required=True, type=Path)
    parser.add_argument("--auth-file", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    arguments = parser.parse_args()

    lock = load_json(LOCK_PATH)
    arms = load_json(ARMS_PATH)
    benchmark_label = f"BehaviorBench v{lock['schemaVersion']}"
    output_label = f"confirmatory-v{lock['schemaVersion']}"
    if lock["status"] not in {"sealed", "running"}:
        raise SystemExit(f"{benchmark_label} cannot run from lock status {lock['status']}")
    if not lock["budget"]["paidCallsAllowed"] and not arguments.dry_run:
        raise SystemExit(f"{benchmark_label} paid calls are locked")
    if arms["model"] != f"{lock['model']['provider']}/{lock['model']['id']}":
        raise SystemExit(f"{benchmark_label} model differs between arms and lock")

    archive = arguments.interference_tarball.resolve()
    if not archive.is_file():
        raise SystemExit(f"Interference tarball not found: {archive}")
    artifact_digest = digest(archive)
    if artifact_digest != lock["repositories"]["interference"]["artifactSha256"]:
        raise SystemExit(f"Interference artifact digest does not match the sealed {benchmark_label} lock")
    seal = computed_seal(archive)
    seal_checks = {
        "task manifest": (seal["taskManifestSha256"], lock["dataset"]["taskManifestSha256"]),
        "verifier bundle": (seal["verifierManifestSha256"], lock["dataset"]["verifierManifestSha256"]),
        "included task IDs": (seal["includedTaskIds"], lock["dataset"]["includedTaskIds"]),
        "analysis bundle": (seal["analysisBundleSha256"], lock["seal"]["analysisBundleSha256"]),
        "runner bundle": (seal["runnerBundleSha256"], lock["seal"]["runnerBundleSha256"]),
    }
    drifted = [name for name, (observed, expected) in seal_checks.items() if observed != expected]
    if drifted:
        raise SystemExit(f"{benchmark_label} seal drift: {', '.join(drifted)}")

    api_key = load_api_key(arguments.auth_file, arguments.dry_run)
    schedule = schedule_trials(lock, arms)
    expected_trials = len(lock["dataset"]["includedTaskIds"]) * 2 * int(lock["analysis"]["replicasPerTreatment"])
    if len(schedule) != expected_trials or expected_trials != 432:
        raise SystemExit(f"{benchmark_label} schedule must contain 432 trials, found {len(schedule)}")

    if arguments.dry_run:
        for task_id, arm, replica in schedule:
            print(f"{output_label} dry-run: {task_id}:{arm['treatment']}:{replica}")
        print(f"{benchmark_label} dry-run passed: 432 unique scheduled trials; no state or provider call created.")
        return

    jobs_root = ROOT / "benchmarks/jobs" / f"{lock['experimentId']}-confirmatory"
    jobs_root.mkdir(parents=True, exist_ok=True)
    state_path = jobs_root / "budget-state.json"
    if state_path.exists():
        state = load_json(state_path)
        if state.get("experimentId") != lock["experimentId"] or state.get("artifactSha256") != artifact_digest:
            raise SystemExit("Existing budget state belongs to a different experiment or artifact")
        if state.get("inFlight"):
            raise SystemExit(f"Ambiguous in-flight trial requires audit before resume: {state['inFlight']['key']}")
    else:
        starting = deepseek_balance(api_key) if api_key else 0.0
        state = {
            "schemaVersion": 2,
            "experimentId": lock["experimentId"],
            "artifactSha256": artifact_digest,
            "startingBalanceUsd": starting,
            "lastBalanceUsd": starting,
            "inFlight": None,
            "trials": [],
            "errors": [],
        }
        save_state(state_path, state)

    completed_keys = {item["key"] for item in state["trials"] if item.get("status") == "complete"}
    for task_id, arm, replica in schedule:
        trial_key = f"{task_id}:{arm['treatment']}:{replica}"
        if trial_key in completed_keys:
            continue
        current = deepseek_balance(api_key) if api_key else float(state["lastBalanceUsd"])
        budget = lock["budget"]
        allowance = float(budget["perTrialAllowanceUsd"])
        if not budget_allows(
            float(state["startingBalanceUsd"]), current, float(budget["hardCapUsd"]), allowance
        ):
            raise SystemExit(f"{benchmark_label} budget gate stopped before {trial_key}")

        task = DATASET / "tasks" / task_id
        attempt = next_attempt(state, trial_key)
        output = jobs_root / trial_key.replace(":", "__") / f"attempt-{attempt}"
        command = [
            "harbor", "run", "-p", str(task),
            "-a", arms["agentImportPath"],
            "-m", arms["model"],
            "--ak", f"treatment={arm['treatment']}",
            "--ak", f"interference_tarball={archive}",
            "--ak", f"interference_sha256={artifact_digest}",
            "--ak", f"reasoning_effort={arms['reasoningEffort']}",
            "--ak", f"max_cost_usd={arms['maxCostUsd']}",
            "--ak", f"max_output_tokens={arms['maxOutputTokens']}",
            "--ak", f"max_steps={arms['maxSteps']}",
            "--ak", f"max_continuations={arms['maxContinuations']}",
            "--n-concurrent", "1", "-q", "-y",
            "-o", str(output), "--job-name", "run",
        ]
        print(f"{output_label}: {trial_key}", flush=True)
        state["inFlight"] = {
            "key": trial_key,
            "attempt": attempt,
            "balanceBeforeUsd": current,
            "output": str(output),
        }
        save_state(state_path, state)
        environment = os.environ.copy()
        environment["PYTHONPATH"] = str(ROOT)
        environment["DEEPSEEK_API_KEY"] = api_key
        completed = subprocess.run(command, cwd=ROOT, env=environment, check=False)
        after = deepseek_balance(api_key)
        result = find_job_result(output)
        clean = completed.returncode == 0 and result["stats"]["n_errored_trials"] == 0 \
            and result["stats"]["n_completed_trials"] == 1
        item = {
            "key": trial_key,
            "status": "complete" if clean else "error",
            "attempt": attempt,
            "output": str(output),
            "harborReturnCode": completed.returncode,
            "balanceBeforeUsd": current,
            "balanceAfterUsd": after,
            "costByBalanceUsd": max(0.0, current - after),
            "artifactSha256": artifact_digest,
        }
        state["lastBalanceUsd"] = after
        state["inFlight"] = None
        if clean:
            state["trials"].append(item)
            completed_keys.add(trial_key)
        else:
            state["errors"].append(item)
        save_state(state_path, state)
        spent = max(0.0, float(state["startingBalanceUsd"]) - after)
        if spent > float(budget["hardCapUsd"]):
            raise RuntimeError(f"{benchmark_label} cap exceeded after bounded trial: ${spent:.4f}")
        if not clean:
            raise RuntimeError(f"Harbor trial was not clean: {trial_key}")

    if not arguments.dry_run:
        spent = float(state["startingBalanceUsd"]) - float(state["lastBalanceUsd"])
        print(f"Completed {len(state['trials'])}/432 paid trials; tracked spend ${spent:.4f}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
