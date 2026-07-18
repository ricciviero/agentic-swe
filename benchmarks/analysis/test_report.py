from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from benchmarks.analysis.report import analyze, exact_mcnemar, load_rows, write_report


class ReportTest(unittest.TestCase):
    def lock(self) -> dict[str, object]:
        return {
            "experimentId": "synthetic",
            "treatments": ["legacy", "authoritative"],
            "analysis": {
                "randomizationSeed": 42,
                "bootstrapReplicates": 500,
                "confidenceLevel": 0.95,
                "functionalNonInferiorityMargin": 0.1,
            },
        }

    def row(self, task: str, treatment: str, safe: bool) -> dict[str, object]:
        return {
            "taskId": task,
            "category": "synthetic",
            "treatment": treatment,
            "functionalSuccess": True,
            "safeSuccess": safe,
            "hardViolation": not safe,
            "completionSupported": safe,
            "policyCompliance": safe,
            "planningPrecision": 1,
            "planningRecall": 1,
            "setupExpected": False,
            "setupObserved": False,
            "skillRoutingPrecision": 1,
            "skillRoutingRecall": 1,
            "skillRoutingF1": 1,
            "validationSucceeded": True,
            "validationFailedBeforeSuccess": False,
            "refusalObserved": False,
            "inputTokens": 10,
            "outputTokens": 5,
            "cachedTokens": 0,
            "costUsd": 0.01,
            "durationMs": 100,
            "toolCalls": 2,
            "failureTaxonomy": "" if safe else "hard-violation",
            "trialPath": f"{task}/{treatment}",
        }

    def test_known_delta_and_exact_pair_counts(self) -> None:
        rows = [
            self.row("one", "legacy", False),
            self.row("one", "authoritative", True),
            self.row("two", "legacy", True),
            self.row("two", "authoritative", True),
        ]
        summary = analyze(rows, self.lock())
        self.assertEqual(summary["metrics"]["safeSuccess"]["difference"], 0.5)
        self.assertEqual(
            summary["metrics"]["safeSuccess"]["exactMcNemar"]["authoritativeWins"],
            1,
        )
        self.assertEqual(exact_mcnemar({"x": 0}, {"x": 1})["twoSidedPValue"], 1.0)
        self.assertTrue(summary["claimAssessment"]["functionalNonInferiority"])
        self.assertEqual(summary["metrics"]["planningPrecision"]["difference"], 0)
        self.assertEqual(summary["costPerSafeSuccessUsd"]["legacy"], 0.02)
        self.assertEqual(summary["costPerSafeSuccessUsd"]["authoritative"], 0.01)
        self.assertEqual(summary["failureTaxonomy"]["legacy"], {"hard-violation": 1})

    def test_load_and_write_are_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for index, row in enumerate([
                self.row("one", "legacy", False),
                self.row("one", "authoritative", True),
            ]):
                path = root / f"trial-{index}" / "verifier"
                path.mkdir(parents=True)
                data = dict(row)
                data["failureTaxonomy"] = data["failureTaxonomy"].split(";") if data["failureTaxonomy"] else []
                (path / "behaviorbench-metrics.json").write_text(json.dumps(data))
            rows = load_rows([root])
            self.assertTrue(all(not Path(row["trialPath"]).is_absolute() for row in rows))
            summary = analyze(rows, self.lock())
            output = root / "report"
            write_report(rows, summary, output)
            first = (output / "summary.json").read_bytes()
            write_report(rows, summary, output)
            self.assertEqual(first, (output / "summary.json").read_bytes())
            self.assertTrue((output / "results.csv").is_file())
            report = (output / "report.md").read_text()
            self.assertIn("## Cost per safe success", report)
            self.assertIn("## Failure taxonomy", report)

    def test_rejects_unpaired_task_sets(self) -> None:
        rows = [self.row("one", "legacy", True), self.row("two", "authoritative", True)]
        with self.assertRaisesRegex(ValueError, "task sets differ"):
            analyze(rows, self.lock())


if __name__ == "__main__":
    unittest.main()
