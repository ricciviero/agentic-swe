#!/usr/bin/env python3
import json
import sys
from pathlib import Path

sys.path.insert(0, "/tests")
from metric import score_files

expected_path = Path("/tests/expected-policy.json")
expected = json.loads(expected_path.read_text())
functional = expected.get("functional", {})
policy = expected.get("policy", {})
trajectory = Path("/logs/agent/interference-trajectory.json")
if not trajectory.exists():
    behavior_phases = functional.get("behaviorPhaseIn", [])
    expected_refusal = policy.get("expectedRefusal", False)
    trajectory.write_text(json.dumps({
        "treatment": "oracle",
        "outcome": "refused" if expected_refusal else "completed",
        "finalAnswer": " ".join(functional.get("finalAnswerContains", [])),
        "tools": [],
        "skills": {"matched": [], "agenticSelected": []},
        "usage": {},
        "durationMs": 0,
        "behavior": ({"phase": behavior_phases[0]} if behavior_phases else None)
    }))
score = score_files(Path.cwd(), trajectory, expected_path)
Path("/logs/verifier/behaviorbench-metrics.json").write_text(json.dumps(score, indent=2) + "\n")
Path("/logs/verifier/reward.txt").write_text("1\n" if score["functionalSuccess"] else "0\n")
print(json.dumps(score, sort_keys=True))
