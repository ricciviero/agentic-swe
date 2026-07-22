"""Shared hashing and seal logic for the BehaviorBench v3 replacement experiment."""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

from benchmarks.scripts.confirmatory_lock import bundle_digest, digest, load_json


ROOT = Path(__file__).resolve().parents[2]
EXPERIMENT = ROOT / "benchmarks/experiments/behaviorbench-dsv4p-20260718-08"
LOCK_PATH = EXPERIMENT / "benchmark-lock.json"
DATASET = ROOT / "benchmarks/harbor/datasets/agentic-swe-behavior-v3"
LOCAL_ARTIFACT = ROOT / "benchmarks/tmp/interference-agent-0.7.0-v2.tgz"
ANALYSIS_BUNDLE = (
    ROOT / "benchmarks/analysis/metric_v2.py",
    ROOT / "benchmarks/analysis/report_v2.py",
    ROOT / "benchmarks/scripts/check_confirmatory_power.py",
)
RUNNER_BUNDLE = (
    EXPERIMENT / "arms.json",
    ROOT / "benchmarks/harbor/agents/interference.py",
    ROOT / "benchmarks/scripts/confirmatory-v3-tasks.mjs",
    ROOT / "benchmarks/scripts/generate-confirmatory-dataset.mjs",
    ROOT / "benchmarks/scripts/confirmatory_v3_lock.py",
    ROOT / "benchmarks/scripts/run_confirmatory.py",
    ROOT / "benchmarks/scripts/run_confirmatory_v3.py",
)


def verifier_digest() -> str:
    lines = []
    for path in sorted((DATASET / "tasks").glob("*/tests/*")):
        if path.is_file():
            relative = path.relative_to(ROOT).as_posix()
            lines.append(f"{digest(path)}  {relative}\n")
    return hashlib.sha256("".join(lines).encode()).hexdigest()


def computed_seal(artifact: Path | None = None) -> dict[str, Any]:
    manifest_path = DATASET / "manifest.json"
    manifest = load_json(manifest_path)
    selected_artifact = artifact or LOCAL_ARTIFACT
    return {
        "taskManifestSha256": digest(manifest_path),
        "verifierManifestSha256": verifier_digest(),
        "includedTaskIds": [task["id"] for task in manifest["tasks"]],
        "artifactSha256": digest(selected_artifact) if selected_artifact.is_file() else None,
        "analysisBundleSha256": bundle_digest(ANALYSIS_BUNDLE),
        "runnerBundleSha256": bundle_digest(RUNNER_BUNDLE),
    }
