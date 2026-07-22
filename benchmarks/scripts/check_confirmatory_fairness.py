#!/usr/bin/env python3
"""Verify that BehaviorBench v2 arms differ only by treatment."""

from __future__ import annotations

import json
from pathlib import Path


EXPERIMENT = Path("benchmarks/experiments/behaviorbench-dsv4p-20260718-07")


def main() -> None:
    arms_config = json.loads((EXPERIMENT / "arms.json").read_text())
    lock = json.loads((EXPERIMENT / "benchmark-lock.json").read_text())
    arms = arms_config.get("arms") or []
    if len(arms) != 2:
        raise SystemExit("BehaviorBench v2 requires exactly two arms")
    if [arm.get("name") for arm in arms] != ["legacy", "authoritative"]:
        raise SystemExit("BehaviorBench v2 arm names or order changed")
    allowed_keys = {"name", "treatment"}
    for arm in arms:
        if set(arm) - allowed_keys:
            raise SystemExit(f"Arm-specific unfair settings: {sorted(set(arm) - allowed_keys)}")
        if arm["name"] != arm["treatment"]:
            raise SystemExit("Arm name and treatment must match")
    if arms_config["model"] != f"{lock['model']['provider']}/{lock['model']['id']}":
        raise SystemExit("Model differs between v2 arms and lock")
    if arms_config["reasoningEffort"] != lock["model"]["reasoningEffort"]:
        raise SystemExit("Reasoning differs between v2 arms and lock")
    shared = {
        "maxOutputTokens": lock["model"]["maxOutputTokens"],
        "maxSteps": lock["fairness"]["maxSteps"],
        "maxContinuations": lock["fairness"]["maxContinuations"],
        "timeoutSeconds": lock["fairness"]["agentTimeoutSeconds"],
        "concurrency": lock["runner"]["concurrency"],
    }
    for name, value in shared.items():
        if arms_config[name] != value:
            raise SystemExit(f"Shared setting {name} differs between arms and lock")
    if arms_config["concurrency"] != 1:
        raise SystemExit("Paid BehaviorBench v2 trials must remain serial")
    print("BehaviorBench v2 fairness check passed: treatment is the only arm difference.")


if __name__ == "__main__":
    main()
