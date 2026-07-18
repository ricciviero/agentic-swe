"""Normalize Harbor BehaviorBench jobs and build deterministic paired reports."""

from __future__ import annotations

import argparse
from collections import Counter
import csv
import json
import math
import random
import statistics
from pathlib import Path
from typing import Any, Iterable


BINARY_METRICS = (
    "functionalSuccess",
    "safeSuccess",
    "hardViolation",
    "completionSupported",
    "policyCompliance",
)
BEHAVIOR_METRICS = (
    "planningPrecision",
    "planningRecall",
    "skillRoutingPrecision",
    "skillRoutingRecall",
    "skillRoutingF1",
)
OVERHEAD_METRICS = ("inputTokens", "outputTokens", "cachedTokens", "costUsd", "durationMs", "toolCalls")
ROW_FIELDS = (
    "taskId",
    "category",
    "treatment",
    *BINARY_METRICS,
    "planningPrecision",
    "planningRecall",
    "setupExpected",
    "setupObserved",
    "skillRoutingPrecision",
    "skillRoutingRecall",
    "skillRoutingF1",
    "validationSucceeded",
    "validationFailedBeforeSuccess",
    "refusalObserved",
    *OVERHEAD_METRICS,
    "failureTaxonomy",
    "trialPath",
)


def load_rows(job_paths: Iterable[Path]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[Path] = set()
    for root in job_paths:
        resolved_root = root.resolve()
        for metrics_path in sorted(root.rglob("behaviorbench-metrics.json")):
            metrics_path = metrics_path.resolve()
            if metrics_path in seen:
                continue
            seen.add(metrics_path)
            row = json.loads(metrics_path.read_text())
            try:
                row["trialPath"] = metrics_path.relative_to(resolved_root).parent.parent.as_posix()
            except ValueError:
                row["trialPath"] = f"{row['taskId']}/{row['treatment']}"
            row["failureTaxonomy"] = ";".join(row.get("failureTaxonomy") or [])
            rows.append(row)
    return sorted(rows, key=lambda row: (row["taskId"], row["treatment"], row["trialPath"]))


def _means(rows: list[dict[str, Any]], metric: str) -> dict[tuple[str, str], float]:
    buckets: dict[tuple[str, str], list[float]] = {}
    for row in rows:
        buckets.setdefault((row["taskId"], row["treatment"]), []).append(float(row[metric]))
    return {key: statistics.fmean(values) for key, values in buckets.items()}


def _percentile(values: list[float], probability: float) -> float:
    ordered = sorted(values)
    if not ordered:
        raise ValueError("Cannot compute a percentile of an empty sample")
    position = (len(ordered) - 1) * probability
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def _bootstrap_ci(
    differences: dict[str, float],
    *,
    replicates: int,
    confidence: float,
    seed: int,
) -> list[float]:
    task_ids = sorted(differences)
    rng = random.Random(seed)
    estimates = [
        statistics.fmean(differences[rng.choice(task_ids)] for _ in task_ids)
        for _ in range(replicates)
    ]
    alpha = (1 - confidence) / 2
    return [_percentile(estimates, alpha), _percentile(estimates, 1 - alpha)]


def exact_mcnemar(legacy: dict[str, float], authoritative: dict[str, float]) -> dict[str, Any]:
    task_ids = sorted(set(legacy) & set(authoritative))
    legacy_wins = sum(legacy[task] >= 0.5 and authoritative[task] < 0.5 for task in task_ids)
    authoritative_wins = sum(legacy[task] < 0.5 and authoritative[task] >= 0.5 for task in task_ids)
    discordant = legacy_wins + authoritative_wins
    if discordant == 0:
        p_value = 1.0
    else:
        tail = sum(math.comb(discordant, index) for index in range(min(legacy_wins, authoritative_wins) + 1))
        p_value = min(1.0, 2 * tail / (2**discordant))
    return {
        "legacyWins": legacy_wins,
        "authoritativeWins": authoritative_wins,
        "discordantPairs": discordant,
        "twoSidedPValue": p_value,
    }


def analyze(rows: list[dict[str, Any]], lock: dict[str, Any]) -> dict[str, Any]:
    treatments = set(lock["treatments"])
    observed = {row["treatment"] for row in rows}
    if not treatments <= observed:
        raise ValueError(f"Missing treatment rows: {sorted(treatments - observed)}")
    task_sets = {
        treatment: {row["taskId"] for row in rows if row["treatment"] == treatment}
        for treatment in treatments
    }
    if len({frozenset(values) for values in task_sets.values()}) != 1:
        raise ValueError(f"Treatment task sets differ: {task_sets}")

    seed = int(lock["analysis"]["randomizationSeed"])
    bootstrap_replicates = int(lock["analysis"]["bootstrapReplicates"])
    confidence = float(lock["analysis"]["confidenceLevel"])
    metrics: dict[str, Any] = {}
    # Keep the frozen metrics first so extending the report cannot change their
    # bootstrap RNG stream. New descriptive metrics are appended after them.
    for offset, metric in enumerate((*BINARY_METRICS, *OVERHEAD_METRICS, *BEHAVIOR_METRICS)):
        means = _means(rows, metric)
        legacy = {task: value for (task, arm), value in means.items() if arm == "legacy"}
        authoritative = {task: value for (task, arm), value in means.items() if arm == "authoritative"}
        differences = {task: authoritative[task] - legacy[task] for task in sorted(legacy)}
        entry: dict[str, Any] = {
            "legacyMean": statistics.fmean(legacy.values()),
            "authoritativeMean": statistics.fmean(authoritative.values()),
            "difference": statistics.fmean(differences.values()),
            "bootstrapCI": _bootstrap_ci(
                differences,
                replicates=bootstrap_replicates,
                confidence=confidence,
                seed=seed + offset,
            ),
        }
        if metric in BINARY_METRICS:
            entry["exactMcNemar"] = exact_mcnemar(legacy, authoritative)
        else:
            entry["legacyMedian"] = statistics.median(legacy.values())
            entry["authoritativeMedian"] = statistics.median(authoritative.values())
            entry["pairedMedianDifference"] = statistics.median(differences.values())
        metrics[metric] = entry

    functional_margin = float(lock["analysis"].get("functionalNonInferiorityMargin") or 0)
    functional_lower = metrics["functionalSuccess"]["bootstrapCI"][0]
    safe_lower = metrics["safeSuccess"]["bootstrapCI"][0]
    completion_lower = metrics["completionSupported"]["bootstrapCI"][0]
    claims = {
        "functionalNonInferiority": functional_lower >= -functional_margin,
        "safeSuccessImprovement": safe_lower > 0,
        "completionSupportImprovement": completion_lower > 0,
    }
    claims["generalPositiveClaim"] = all(claims.values())

    failure_taxonomy: dict[str, dict[str, int]] = {}
    cost_per_safe_success: dict[str, float | None] = {}
    for treatment in sorted(treatments):
        treatment_rows = [row for row in rows if row["treatment"] == treatment]
        failures: Counter[str] = Counter()
        for row in treatment_rows:
            values = row.get("failureTaxonomy") or []
            if isinstance(values, str):
                values = [value for value in values.split(";") if value]
            failures.update(values)
        failure_taxonomy[treatment] = dict(sorted(failures.items()))
        safe_successes = sum(float(row["safeSuccess"]) for row in treatment_rows)
        cost_per_safe_success[treatment] = (
            sum(float(row["costUsd"]) for row in treatment_rows) / safe_successes
            if safe_successes
            else None
        )

    return {
        "schemaVersion": 1,
        "experimentId": lock["experimentId"],
        "taskCount": len(next(iter(task_sets.values()))),
        "trialCount": len(rows),
        "treatments": sorted(treatments),
        "metrics": metrics,
        "failureTaxonomy": failure_taxonomy,
        "costPerSafeSuccessUsd": cost_per_safe_success,
        "claimAssessment": {
            "functionalNonInferiorityMargin": functional_margin,
            **claims,
        },
    }


def write_report(rows: list[dict[str, Any]], summary: dict[str, Any], output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    with (output / "results.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=ROW_FIELDS,
            extrasaction="ignore",
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(rows)
    (output / "summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n")

    lines = [
        f"# BehaviorBench report: {summary['experimentId']}",
        "",
        f"Tasks: {summary['taskCount']} · Trials: {summary['trialCount']}",
        "",
        "| Metric | Legacy | Authoritative | Difference | 95% bootstrap CI |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for metric, values in summary["metrics"].items():
        low, high = values["bootstrapCI"]
        lines.append(
            f"| {metric} | {values['legacyMean']:.4f} | {values['authoritativeMean']:.4f} | "
            f"{values['difference']:+.4f} | [{low:+.4f}, {high:+.4f}] |"
        )
    lines.extend([
        "",
        "Differences are authoritative minus legacy. Binary tests use task-level paired "
        "majorities; bootstrap resampling uses tasks as clusters.",
        "",
        "## Claim assessment",
        "",
        f"- Functional non-inferiority demonstrated at margin "
        f"`{summary['claimAssessment']['functionalNonInferiorityMargin']:.2f}`: "
        f"**{'yes' if summary['claimAssessment']['functionalNonInferiority'] else 'no'}**",
        f"- Safe-success improvement demonstrated: "
        f"**{'yes' if summary['claimAssessment']['safeSuccessImprovement'] else 'no'}**",
        f"- Completion-support improvement demonstrated: "
        f"**{'yes' if summary['claimAssessment']['completionSupportImprovement'] else 'no'}**",
        f"- General positive claim allowed by the preregistered policy: "
        f"**{'yes' if summary['claimAssessment']['generalPositiveClaim'] else 'no'}**",
        "",
        "A claim is demonstrated only when the corresponding 95% task-cluster bootstrap "
        "interval clears its frozen threshold. Point estimates remain descriptive.",
        "",
        "## Cost per safe success",
        "",
        "| Treatment | Total cost / safe successes |",
        "| --- | ---: |",
        *[
            f"| {treatment} | "
            + (
                f"${value:.4f} |"
                if value is not None
                else "n/a (no safe successes) |"
            )
            for treatment, value in summary["costPerSafeSuccessUsd"].items()
        ],
        "",
        "This descriptive ratio divides total trajectory-estimated treatment cost by the number "
        "of safe-success trials; it is not part of the claim gate.",
        "",
        "## Failure taxonomy",
        "",
        "| Treatment | Failure | Count |",
        "| --- | --- | ---: |",
        *[
            f"| {treatment} | {failure} | {count} |"
            for treatment, failures in summary["failureTaxonomy"].items()
            for failure, count in failures.items()
        ],
        "",
        "Counts are non-exclusive: one trial may contribute more than one failure label.",
        "",
    ])
    (output / "report.md").write_text("\n".join(lines))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--job", action="append", required=True, type=Path)
    parser.add_argument("--lock", default=Path("benchmarks/benchmark-lock.json"), type=Path)
    parser.add_argument("--output", required=True, type=Path)
    arguments = parser.parse_args()
    rows = load_rows(arguments.job)
    if not rows:
        raise SystemExit("No BehaviorBench verifier metrics found")
    lock = json.loads(arguments.lock.read_text())
    summary = analyze(rows, lock)
    write_report(rows, summary, arguments.output)


if __name__ == "__main__":
    main()
