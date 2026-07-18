from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from benchmarks.analysis.report_v2 import analyze, load_rows, load_state_rows, write_report


class ReportV2Test(unittest.TestCase):
    def lock(self, tasks=None, replicas=3):
        task_ids = tasks or ["one", "two"]
        return {
            "experimentId": "synthetic-v2",
            "treatments": ["legacy", "authoritative"],
            "dataset": {
                "includedTaskIds": task_ids,
                "cohorts": {"behavior": len(task_ids), "neutral-control": 0},
            },
            "analysis": {
                "randomizationSeed": 42,
                "replicasPerTreatment": replicas,
                "bootstrapReplicates": 500,
                "confidenceLevel": 0.95,
                "primaryCohort": "policy-sensitive",
            },
            "claimPolicy": {
                "functionalDifferenceLowerBoundAtLeast": -0.1,
                "safeSuccessLowerBoundAbove": 0,
                "completionSupportLowerBoundAbove": 0,
            },
        }

    def row(self, task, treatment, replica, safe):
        return {
            "taskId": task,
            "category": "behavior",
            "cohorts": ["policy-sensitive", "behavior"],
            "treatment": treatment,
            "replica": replica,
            "functionalSuccess": True,
            "safeSuccess": safe,
            "hardViolation": not safe,
            "completionSupported": safe,
            "policyCompliance": safe,
            "planningPrecision": 1,
            "planningRecall": 1,
            "skillRoutingPrecision": 1,
            "skillRoutingRecall": 1,
            "skillRoutingF1": 1,
            "inputTokens": 10,
            "outputTokens": 5,
            "cachedTokens": 0,
            "costUsd": 0.01,
            "durationMs": 100,
            "toolCalls": 2,
            "failureTaxonomy": [] if safe else ["hard-violation"],
            "trialPath": f"{task}__{treatment}__{replica}/run",
        }

    def complete_rows(self):
        rows = []
        for replica in (1, 2, 3):
            rows.extend([
                self.row("one", "legacy", replica, False),
                self.row("one", "authoritative", replica, True),
                self.row("two", "legacy", replica, True),
                self.row("two", "authoritative", replica, True),
            ])
        return rows

    def test_three_replicas_reduce_to_task_majorities(self):
        task_rows, summary = analyze(self.complete_rows(), self.lock())
        self.assertEqual(len(task_rows), 4)
        self.assertTrue(summary["completeness"]["complete"])
        safe = summary["scopes"]["policy-sensitive"]["metrics"]["safeSuccess"]
        self.assertEqual(safe["difference"], 0.5)
        self.assertEqual(safe["exactMcNemar"]["authoritativeWins"], 1)

    def test_missing_replica_disables_claim_without_silent_drop(self):
        rows = self.complete_rows()[:-1]
        _, summary = analyze(rows, self.lock())
        self.assertFalse(summary["completeness"]["complete"])
        self.assertTrue(summary["completeness"]["missingOrDuplicateGroups"])
        self.assertFalse(summary["claimAssessment"]["limitedPositiveBehaviorClaim"])

    def test_load_rows_extracts_replica_and_report_is_deterministic(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for row in self.complete_rows():
                path = root / row["trialPath"].split("/")[0] / "run" / "verifier"
                path.mkdir(parents=True)
                data = dict(row)
                data.pop("replica")
                data.pop("trialPath")
                (path / "behaviorbench-metrics.json").write_text(json.dumps(data))
            loaded = load_rows([root])
            self.assertEqual({row["replica"] for row in loaded}, {1, 2, 3})
            task_rows, summary = analyze(loaded, self.lock())
            output = root / "report"
            write_report(loaded, task_rows, summary, output)
            first = (output / "summary.json").read_bytes()
            write_report(loaded, task_rows, summary, output)
            self.assertEqual(first, (output / "summary.json").read_bytes())
            self.assertTrue((output / "task-majorities.csv").is_file())
            self.assertIn("Preregistered claim gate", (output / "report.md").read_text())

    def test_state_loader_selects_only_recorded_clean_attempts(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "attempt-2"
            metrics = output / "run" / "trial" / "verifier"
            metrics.mkdir(parents=True)
            row = self.row("one", "legacy", 1, True)
            row.pop("replica")
            row.pop("trialPath")
            (metrics / "behaviorbench-metrics.json").write_text(json.dumps(row))
            state = root / "budget-state.json"
            state.write_text(json.dumps({
                "trials": [{
                    "key": "one:legacy:1",
                    "status": "complete",
                    "attempt": 2,
                    "output": str(output),
                }],
                "errors": [{"key": "one:legacy:1", "attempt": 1}],
            }))
            loaded = load_state_rows(state)
            self.assertEqual(len(loaded), 1)
            self.assertEqual(loaded[0]["replica"], 1)
            self.assertEqual(loaded[0]["trialPath"], "one__legacy__1/attempt-2")


if __name__ == "__main__":
    unittest.main()
