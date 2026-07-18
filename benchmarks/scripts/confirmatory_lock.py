"""Shared hashing and seal logic for the BehaviorBench v2 experiment."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
EXPERIMENT = ROOT / "benchmarks/experiments/behaviorbench-dsv4p-20260718-07"
LOCK_PATH = EXPERIMENT / "benchmark-lock.json"
DATASET = ROOT / "benchmarks/harbor/datasets/agentic-swe-behavior-v2"
LOCAL_ARTIFACT = ROOT / "benchmarks/tmp/interference-agent-0.7.0-v2.tgz"
ANALYSIS_BUNDLE = (
    ROOT / "benchmarks/analysis/metric_v2.py",
    ROOT / "benchmarks/analysis/report_v2.py",
    ROOT / "benchmarks/scripts/check_confirmatory_power.py",
)
RUNNER_BUNDLE = (
    EXPERIMENT / "arms.json",
    ROOT / "benchmarks/harbor/agents/interference.py",
    ROOT / "benchmarks/scripts/confirmatory-tasks.mjs",
    ROOT / "benchmarks/scripts/generate-confirmatory-dataset.mjs",
    ROOT / "benchmarks/scripts/run_confirmatory.py",
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def verifier_digest() -> str:
    lines = []
    for path in sorted((DATASET / "tasks").glob("*/tests/*")):
        if path.is_file():
            relative = path.relative_to(ROOT).as_posix()
            lines.append(f"{digest(path)}  {relative}\n")
    return hashlib.sha256("".join(lines).encode()).hexdigest()


def bundle_digest(paths: tuple[Path, ...]) -> str:
    lines = [f"{digest(path)}  {path.relative_to(ROOT).as_posix()}\n" for path in paths]
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
