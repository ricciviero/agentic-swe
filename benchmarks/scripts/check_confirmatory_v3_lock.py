#!/usr/bin/env python3
"""Verify the sealed BehaviorBench v3 replacement inputs without provider access."""

from __future__ import annotations

import re
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from benchmarks.scripts.confirmatory_v3_lock import (
    DATASET,
    LOCAL_ARTIFACT,
    LOCK_PATH,
    computed_seal,
    load_json,
)


def main() -> None:
    lock = load_json(LOCK_PATH)
    if lock["status"] not in {"sealed", "running", "complete"}:
        raise SystemExit("BehaviorBench v3 replacement lock is not sealed")
    seal = computed_seal()
    expected = lock["dataset"]
    checks = (
        (seal["taskManifestSha256"], expected["taskManifestSha256"], "task manifest"),
        (seal["verifierManifestSha256"], expected["verifierManifestSha256"], "verifier bundle"),
        (seal["includedTaskIds"], expected["includedTaskIds"], "included task IDs"),
        (seal["analysisBundleSha256"], lock["seal"]["analysisBundleSha256"], "analysis bundle"),
        (seal["runnerBundleSha256"], lock["seal"]["runnerBundleSha256"], "runner bundle"),
    )
    for observed, locked, name in checks:
        if observed != locked:
            raise SystemExit(f"BehaviorBench v3 {name} differs from the lock")
    if len(seal["includedTaskIds"]) != 72 or expected["primaryTaskCount"] != 60:
        raise SystemExit("BehaviorBench v3 task counts differ from the preregistration")
    if set(lock["provenance"]["replacedTaskIds"]) & set(seal["includedTaskIds"]):
        raise SystemExit("BehaviorBench v3 contains an exposed task ID")
    artifact_digest = lock["repositories"]["interference"]["artifactSha256"]
    if not isinstance(artifact_digest, str) or not re.fullmatch(r"[0-9a-f]{64}", artifact_digest):
        raise SystemExit("BehaviorBench v3 Interference artifact is not digest-sealed")
    if LOCAL_ARTIFACT.exists() and seal["artifactSha256"] != artifact_digest:
        raise SystemExit("Local BehaviorBench v3 Interference artifact differs from the lock")
    image = lock["runner"]["containerImage"]
    if "@sha256:" not in image:
        raise SystemExit("BehaviorBench v3 container image is not digest-pinned")
    for dockerfile in sorted((DATASET / "tasks").glob("*/environment/Dockerfile")):
        if dockerfile.read_text().splitlines()[0] != f"FROM {image}":
            raise SystemExit(f"Container pin mismatch in {dockerfile}")
    if lock["analysis"]["replicasPerTreatment"] != 3:
        raise SystemExit("BehaviorBench v3 requires three replicas per treatment")
    if lock["budget"]["hardCapUsd"] > lock["budget"]["authorizedAdditionalUsd"]:
        raise SystemExit("Operational cap exceeds the v3 authorization")
    if lock["provenance"]["invalidatedDataIncluded"] is not False:
        raise SystemExit("Invalidated v2 data must remain excluded")
    print("BehaviorBench v3 replacement sealed lock check passed.")


if __name__ == "__main__":
    main()
