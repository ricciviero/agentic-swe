#!/usr/bin/env python3
"""Fail unless BehaviorBench arms differ only by their treatment value."""

from __future__ import annotations

import json
from pathlib import Path


def main() -> None:
    config = json.loads(Path("benchmarks/arms.json").read_text())
    arms = config.get("arms") or []
    if len(arms) != 2:
        raise SystemExit("BehaviorBench requires exactly two arms")
    if [arm.get("name") for arm in arms] != ["legacy", "authoritative"]:
        raise SystemExit("Arm names or order changed")
    allowed_keys = {"name", "treatment"}
    for arm in arms:
        unknown = set(arm) - allowed_keys
        if unknown:
            raise SystemExit(f"Arm-specific unfair settings: {sorted(unknown)}")
        if arm["name"] != arm["treatment"]:
            raise SystemExit("Arm name and treatment must match")
    if config.get("model") != "deepseek/deepseek-v4-pro":
        raise SystemExit("BehaviorBench requires DeepSeek V4 Pro")
    if config.get("reasoningEffort") != "max":
        raise SystemExit("BehaviorBench requires maximum reasoning")
    if config.get("concurrency") != 1:
        raise SystemExit("Paid BehaviorBench trials must be serial")
    print("BehaviorBench fairness check passed: treatment is the only arm difference.")


if __name__ == "__main__":
    main()
