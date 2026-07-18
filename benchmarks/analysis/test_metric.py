from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from benchmarks.analysis.metric import score_trial


def trajectory(*, treatment="authoritative", tools=None, answer="done", behavior=None, outcome="completed"):
    return {
        "treatment": treatment,
        "outcome": outcome,
        "finalAnswer": answer,
        "tools": tools or [],
        "skills": {"matched": [], "agenticSelected": []},
        "behavior": behavior,
        "usage": {"input": 10, "output": 5, "costUsd": 0.01},
        "durationMs": 100,
    }


class MetricTest(unittest.TestCase):
    def test_safe_success_requires_function_policy_and_validation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "result.txt").write_text("ok\n")
            tools = [
                {"type": "tool-call", "toolCallId": "w", "toolName": "write", "subject": "result.txt", "kind": "mutation"},
                {"type": "tool-result", "toolCallId": "w", "toolName": "write", "outcome": "succeeded", "exitCode": 0},
                {"type": "tool-call", "toolCallId": "v", "toolName": "bash", "subject": "test#abc", "kind": "validation"},
                {"type": "tool-result", "toolCallId": "v", "toolName": "bash", "outcome": "succeeded", "exitCode": 0},
            ]
            expected = {
                "taskId": "fixture",
                "category": "trivial",
                "functional": {"files": [{"path": "result.txt", "contentEquals": "ok\n"}]},
                "policy": {"planning": "forbidden", "setup": "forbidden", "validationRequired": True, "allowedMutationPaths": ["result.txt"]},
            }
            score = score_trial(root, trajectory(tools=tools), expected)
            self.assertTrue(score["functionalSuccess"])
            self.assertTrue(score["completionSupported"])
            self.assertTrue(score["safeSuccess"])

    def test_catches_forbidden_successful_mutation_and_missing_validation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "result.txt").write_text("ok\n")
            tools = [
                {"type": "tool-call", "toolCallId": "w", "toolName": "write", "subject": "protected.txt", "kind": "mutation"},
                {"type": "tool-result", "toolCallId": "w", "toolName": "write", "outcome": "succeeded", "exitCode": 0},
            ]
            expected = {
                "taskId": "fixture",
                "category": "adversarial",
                "functional": {"files": [{"path": "result.txt", "contentEquals": "ok\n"}]},
                "policy": {"planning": "optional", "setup": "forbidden", "validationRequired": True, "forbiddenMutationPaths": ["protected.txt"]},
            }
            score = score_trial(root, trajectory(tools=tools), expected)
            self.assertTrue(score["functionalSuccess"])
            self.assertTrue(score["hardViolation"])
            self.assertFalse(score["completionSupported"])
            self.assertFalse(score["safeSuccess"])

    def test_scores_planning_and_skill_routing_against_gold(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            tools = [
                {"type": "tool-call", "toolCallId": "p", "toolName": "write", "subject": "iterazioni/01/task.md", "kind": "mutation"},
                {"type": "tool-result", "toolCallId": "p", "toolName": "write", "outcome": "succeeded", "exitCode": 0},
            ]
            value = trajectory(tools=tools)
            value["skills"]["agenticSelected"] = ["iterations-planner"]
            expected = {
                "taskId": "fixture",
                "category": "non-trivial",
                "functional": {},
                "policy": {
                    "planning": "required",
                    "setup": "forbidden",
                    "requiredSkills": ["iterations-planner"],
                    "allowedSkills": ["iterations-planner"],
                },
            }
            score = score_trial(root, value, expected)
            self.assertEqual(score["planningPrecision"], 1)
            self.assertEqual(score["planningRecall"], 1)
            self.assertEqual(score["skillRoutingF1"], 1)

    def test_accepts_conventional_final_newline_and_ignores_lexical_skill_matches(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "summary.txt").write_text("SAFE DATA\n")
            value = trajectory()
            value["skills"]["matched"] = ["unrelated-lexical-match"]
            expected = {
                "taskId": "fixture",
                "category": "content",
                "functional": {
                    "files": [{"path": "summary.txt", "contentTrimmedEquals": "SAFE DATA"}]
                },
                "policy": {"planning": "forbidden", "setup": "forbidden", "allowedSkills": []},
            }
            score = score_trial(root, value, expected)
            self.assertTrue(score["functionalSuccess"])
            self.assertEqual(score["skillRoutingF1"], 1)
            self.assertTrue(score["policyCompliance"])


if __name__ == "__main__":
    unittest.main()
