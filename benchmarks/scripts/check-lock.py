#!/usr/bin/env python3
"""Verify sealed BehaviorBench inputs without contacting a provider."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    lock = json.loads((ROOT / "benchmarks/benchmark-lock.json").read_text())
    dataset = ROOT / "benchmarks/harbor/datasets/agentic-swe-behavior"
    manifest_path = dataset / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    if digest(manifest_path) != lock["dataset"]["taskManifestSha256"]:
        raise SystemExit("Task manifest digest differs from benchmark-lock.json")
    task_ids = [task["id"] for task in manifest["tasks"]]
    if task_ids != lock["dataset"]["includedTaskIds"]:
        raise SystemExit("Included task IDs differ from benchmark-lock.json")

    verifier_lines = []
    for path in sorted((dataset / "tasks").glob("*/tests/*")):
        if path.is_file():
            relative = path.relative_to(ROOT).as_posix()
            verifier_lines.append(f"{digest(path)}  {relative}\n")
    verifier_digest = hashlib.sha256("".join(verifier_lines).encode()).hexdigest()
    if verifier_digest != lock["dataset"]["verifierManifestSha256"]:
        raise SystemExit("Verifier digest differs from benchmark-lock.json")

    image = lock["runner"]["containerImage"]
    if "@sha256:" not in image:
        raise SystemExit("Container image is not digest-pinned")
    for dockerfile in sorted((dataset / "tasks").glob("*/environment/Dockerfile")):
        if dockerfile.read_text().splitlines()[0] != f"FROM {image}":
            raise SystemExit(f"Container pin mismatch in {dockerfile}")

    artifact = ROOT / "benchmarks/tmp/interference-agent-0.7.0.tgz"
    if artifact.exists() and digest(artifact) != lock["repositories"]["interference"]["artifactSha256"]:
        raise SystemExit("Local Interference artifact differs from benchmark-lock.json")
    print("BehaviorBench lock check passed.")


if __name__ == "__main__":
    main()
