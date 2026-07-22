#!/usr/bin/env python3
"""Seal generated v2 inputs without enabling paid calls."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from benchmarks.scripts.confirmatory_lock import LOCK_PATH, computed_seal, load_json


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact", required=True, type=Path)
    arguments = parser.parse_args()
    lock = load_json(LOCK_PATH)
    if lock["status"] not in {"design-locked", "sealed"}:
        raise SystemExit(f"Cannot seal lock in status {lock['status']}")
    if lock["budget"]["paidCallsAllowed"]:
        raise SystemExit("Refusing to modify a lock while paid calls are enabled")
    seal = computed_seal(arguments.artifact.resolve())
    if not seal["artifactSha256"]:
        raise SystemExit("Interference artifact is missing")
    lock["status"] = "sealed"
    lock["repositories"]["interference"]["artifactSha256"] = seal["artifactSha256"]
    lock["dataset"]["taskManifestSha256"] = seal["taskManifestSha256"]
    lock["dataset"]["verifierManifestSha256"] = seal["verifierManifestSha256"]
    lock["dataset"]["includedTaskIds"] = seal["includedTaskIds"]
    lock["seal"]["analysisBundleSha256"] = seal["analysisBundleSha256"]
    lock["seal"]["runnerBundleSha256"] = seal["runnerBundleSha256"]
    LOCK_PATH.write_text(json.dumps(lock, indent=2) + "\n")
    print(f"Sealed BehaviorBench v2 lock with {len(seal['includedTaskIds'])} tasks; paid calls remain disabled.")


if __name__ == "__main__":
    main()
