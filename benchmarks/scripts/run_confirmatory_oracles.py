#!/usr/bin/env python3
"""Run every BehaviorBench confirmatory oracle in fresh provider-free containers."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
def run(command: list[str]) -> None:
    completed = subprocess.run(command, cwd=ROOT, check=False)
    if completed.returncode != 0:
        raise RuntimeError(f"Command exited {completed.returncode}: {' '.join(command[:4])}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--passes", type=int, default=2)
    parser.add_argument("--task", action="append", dest="tasks")
    parser.add_argument("--version", choices=("2", "3"), default="2")
    arguments = parser.parse_args()
    dataset = ROOT / f"benchmarks/harbor/datasets/agentic-swe-behavior-v{arguments.version}"
    if arguments.passes <= 0:
        raise SystemExit("Oracle passes must be positive")
    manifest = json.loads((dataset / "manifest.json").read_text())
    available = [task["id"] for task in manifest["tasks"]]
    selected = arguments.tasks or available
    unknown = sorted(set(selected) - set(available))
    if unknown:
        raise SystemExit(f"Unknown v{arguments.version} oracle task IDs: {unknown}")

    images: dict[str, str] = {}
    for task_id in selected:
        task = dataset / "tasks" / task_id
        digest = hashlib.sha256((task / "environment/Dockerfile").read_bytes()).hexdigest()[:12]
        image = f"behaviorbench-v{arguments.version}-oracle:{task_id[:32]}-{digest}"
        run(["docker", "build", "-q", "-t", image, str(task / "environment")])
        images[task_id] = image

    completed = 0
    for pass_number in range(1, arguments.passes + 1):
        for task_id in selected:
            task = dataset / "tasks" / task_id
            command = [
                "docker", "run", "--rm", "--network", "none",
                "--mount", f"type=bind,src={task / 'solution'},dst=/solution,readonly",
                "--mount", f"type=bind,src={task / 'tests'},dst=/tests,readonly",
                "-w", "/workspace", images[task_id],
                "sh", "-lc",
                "mkdir -p /logs/agent /logs/verifier && /solution/solve.sh && /tests/test.sh && test \"$(cat /logs/verifier/reward.txt)\" = 1",
            ]
            run(command)
            completed += 1
            print(f"oracle pass {pass_number}/{arguments.passes}: {task_id}", flush=True)
    print(f"BehaviorBench v{arguments.version} oracle check passed: {completed} clean containers.")


if __name__ == "__main__":
    main()
