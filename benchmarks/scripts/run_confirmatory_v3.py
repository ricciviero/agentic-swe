#!/usr/bin/env python3
"""Run the BehaviorBench v3 replacement through the sealed generic runner."""

from __future__ import annotations

import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from benchmarks.scripts import run_confirmatory as runner
from benchmarks.scripts.confirmatory_v3_lock import DATASET, EXPERIMENT, LOCK_PATH, computed_seal


def main() -> None:
    runner.EXPERIMENT = EXPERIMENT
    runner.LOCK_PATH = LOCK_PATH
    runner.ARMS_PATH = EXPERIMENT / "arms.json"
    runner.DATASET = DATASET
    runner.computed_seal = computed_seal
    runner.main()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
