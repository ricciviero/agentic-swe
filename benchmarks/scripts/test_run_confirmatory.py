from __future__ import annotations

import unittest

from benchmarks.scripts.run_confirmatory import budget_allows, next_attempt, schedule_trials


class ConfirmatoryRunnerTest(unittest.TestCase):
    def lock(self):
        return {
            "dataset": {"includedTaskIds": [f"task-{index}" for index in range(72)]},
            "analysis": {"replicasPerTreatment": 3, "randomizationSeed": 42},
        }

    def arms(self):
        return {"arms": [
            {"name": "legacy", "treatment": "legacy"},
            {"name": "authoritative", "treatment": "authoritative"},
        ]}

    def test_schedule_is_deterministic_balanced_and_complete(self):
        first = schedule_trials(self.lock(), self.arms())
        second = schedule_trials(self.lock(), self.arms())
        self.assertEqual(first, second)
        self.assertEqual(len(first), 432)
        self.assertEqual(len(set((task, arm["treatment"], replica) for task, arm, replica in first)), 432)

    def test_budget_gate_reserves_one_bounded_trial(self):
        self.assertTrue(budget_allows(8.0, 4.0, 5.0, 0.1))
        self.assertFalse(budget_allows(8.0, 3.05, 5.0, 0.1))

    def test_retry_uses_a_fresh_attempt_after_a_recorded_error(self):
        state = {"errors": [{"key": "task:legacy:1"}, {"key": "other:legacy:1"}]}
        self.assertEqual(next_attempt(state, "task:legacy:1"), 2)
        self.assertEqual(next_attempt(state, "task:authoritative:1"), 1)


if __name__ == "__main__":
    unittest.main()
