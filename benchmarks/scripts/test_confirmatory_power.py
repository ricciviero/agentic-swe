from __future__ import annotations

import unittest

from benchmarks.scripts.check_confirmatory_power import (
    exact_mcnemar_p_value,
    unconditional_power,
)


class ConfirmatoryPowerTest(unittest.TestCase):
    def test_exact_two_sided_mcnemar(self):
        self.assertEqual(exact_mcnemar_p_value(0, 0), 1)
        self.assertAlmostEqual(exact_mcnemar_p_value(6, 6), 0.03125)

    def test_frozen_design_is_about_eighty_percent(self):
        value = unconditional_power(
            60,
            absolute_difference=0.2,
            discordance=0.3,
            alpha=0.05,
        )
        self.assertGreaterEqual(value, 0.79)
        self.assertLess(value, 0.81)

    def test_invalid_assumptions_are_rejected(self):
        with self.assertRaises(ValueError):
            unconditional_power(60, absolute_difference=0.4, discordance=0.3, alpha=0.05)


if __name__ == "__main__":
    unittest.main()
