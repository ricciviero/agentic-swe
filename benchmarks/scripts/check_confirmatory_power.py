#!/usr/bin/env python3
"""Exact unconditional McNemar power check for the frozen v2 assumptions."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


DEFAULT_LOCK = Path(
    "benchmarks/experiments/behaviorbench-dsv4p-20260718-07/benchmark-lock.json"
)


def binomial_probability(n: int, successes: int, probability: float) -> float:
    return math.comb(n, successes) * probability**successes * (1 - probability) ** (n - successes)


def exact_mcnemar_p_value(discordant: int, authoritative_wins: int) -> float:
    if discordant == 0:
        return 1.0
    smaller_tail = min(authoritative_wins, discordant - authoritative_wins)
    tail = sum(binomial_probability(discordant, value, 0.5) for value in range(smaller_tail + 1))
    return min(1.0, 2 * tail)


def unconditional_power(
    task_count: int,
    *,
    absolute_difference: float,
    discordance: float,
    alpha: float,
) -> float:
    if not 0 < absolute_difference <= discordance <= 1:
        raise ValueError("Power assumptions require 0 < difference <= discordance <= 1")
    authoritative_win = (discordance + absolute_difference) / 2
    conditional_win = authoritative_win / discordance
    power = 0.0
    for discordant_count in range(task_count + 1):
        probability_discordant = binomial_probability(task_count, discordant_count, discordance)
        for authoritative_wins in range(discordant_count + 1):
            if exact_mcnemar_p_value(discordant_count, authoritative_wins) >= alpha:
                continue
            power += probability_discordant * binomial_probability(
                discordant_count,
                authoritative_wins,
                conditional_win,
            )
    return power


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lock", default=DEFAULT_LOCK, type=Path)
    arguments = parser.parse_args()
    lock = json.loads(arguments.lock.read_text())
    frozen = lock["analysis"]["power"]
    observed = unconditional_power(
        int(frozen["primaryTaskClusters"]),
        absolute_difference=float(frozen["targetAbsoluteDifference"]),
        discordance=float(frozen["assumedDiscordance"]),
        alpha=float(frozen["alpha"]),
    )
    target = float(frozen["target"])
    if observed < target:
        raise SystemExit(f"Frozen design power {observed:.6f} is below target {target:.6f}")
    print(f"BehaviorBench v2 exact power check passed: {observed:.6f} >= {target:.6f}.")


if __name__ == "__main__":
    main()
