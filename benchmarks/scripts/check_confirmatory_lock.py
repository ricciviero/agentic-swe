#!/usr/bin/env python3
"""Verify the sealed BehaviorBench v2 inputs without provider access."""

from __future__ import annotations

import re
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from benchmarks.scripts.confirmatory_lock import (
    DATASET,
    LOCAL_ARTIFACT,
    LOCK_PATH,
    computed_seal,
    load_json,
)


def main() -> None:
    lock = load_json(LOCK_PATH)
    if lock["status"] not in {"sealed", "running", "complete"}:
        raise SystemExit("BehaviorBench v2 lock is not sealed")
    seal = computed_seal()
    expected = lock["dataset"]
    if seal["taskManifestSha256"] != expected["taskManifestSha256"]:
        raise SystemExit("BehaviorBench v2 task manifest differs from the lock")
    if seal["verifierManifestSha256"] != expected["verifierManifestSha256"]:
        raise SystemExit("BehaviorBench v2 verifier bundle differs from the lock")
    if seal["includedTaskIds"] != expected["includedTaskIds"]:
        raise SystemExit("BehaviorBench v2 included task IDs differ from the lock")
    if seal["analysisBundleSha256"] != lock["seal"]["analysisBundleSha256"]:
        raise SystemExit("BehaviorBench v2 analysis bundle differs from the lock")
    if seal["runnerBundleSha256"] != lock["seal"]["runnerBundleSha256"]:
        raise SystemExit("BehaviorBench v2 runner bundle differs from the lock")
    if len(seal["includedTaskIds"]) != 72 or expected["primaryTaskCount"] != 60:
        raise SystemExit("BehaviorBench v2 task counts differ from the preregistration")
    artifact_digest = lock["repositories"]["interference"]["artifactSha256"]
    if not isinstance(artifact_digest, str) or not re.fullmatch(r"[0-9a-f]{64}", artifact_digest):
        raise SystemExit("BehaviorBench v2 Interference artifact is not digest-sealed")
    if LOCAL_ARTIFACT.exists() and seal["artifactSha256"] != artifact_digest:
        raise SystemExit("Local BehaviorBench v2 Interference artifact differs from the lock")
    image = lock["runner"]["containerImage"]
    if "@sha256:" not in image:
        raise SystemExit("BehaviorBench v2 container image is not digest-pinned")
    for dockerfile in sorted((DATASET / "tasks").glob("*/environment/Dockerfile")):
        if dockerfile.read_text().splitlines()[0] != f"FROM {image}":
            raise SystemExit(f"Container pin mismatch in {dockerfile}")
    if lock["analysis"]["replicasPerTreatment"] != 3:
        raise SystemExit("BehaviorBench v2 requires three replicas per treatment")
    if lock["budget"]["hardCapUsd"] > lock["budget"]["authorizedAdditionalUsd"]:
        raise SystemExit("Operational cap exceeds the v2 authorization")
    print("BehaviorBench v2 sealed lock check passed.")


if __name__ == "__main__":
    main()
