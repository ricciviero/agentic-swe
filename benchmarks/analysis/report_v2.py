"""Task-clustered analysis and deterministic reporting for BehaviorBench v2."""

from __future__ import annotations

import argparse
from collections import Counter
import csv
import json
import math
import random
import re
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
TRIAL_FIELDS = (
    "taskId",
    "category",
    "cohorts",
    "treatment",
    "replica",
    *BINARY_METRICS,
    *BEHAVIOR_METRICS,
    "setupExpected",
    "setupObserved",
    "validationSucceeded",
    "validationFailedBeforeSuccess",
    "refusalObserved",
    *OVERHEAD_METRICS,
    "changedPaths",
    "hiddenCheckFailures",
    "failureTaxonomy",
    "trialPath",
)
TASK_FIELDS = (
    "taskId",
    "category",
    "cohorts",
    "treatment",
    "replicas",
    *BINARY_METRICS,
    *BEHAVIOR_METRICS,
    *OVERHEAD_METRICS,
)


def _as_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, str):
        return [item for item in value.split(";") if item]
    return []


def _replica_from_path(path: str) -> int | None:
    match = re.search(r"__(\d+)(?:/|$)", path)
    return int(match.group(1)) if match else None


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
                trial_path = metrics_path.relative_to(resolved_root).parent.parent.as_posix()
            except ValueError:
                trial_path = f"{row['taskId']}__{row['treatment']}__unknown"
            row["trialPath"] = trial_path
            row["replica"] = row.get("replica") or _replica_from_path(trial_path)
            row["cohorts"] = _as_list(row.get("cohorts"))
            row["failureTaxonomy"] = _as_list(row.get("failureTaxonomy"))
            rows.append(row)
    return sorted(rows, key=lambda row: (
        row["taskId"], row["treatment"], row.get("replica") or 0, row["trialPath"],
    ))


def load_state_rows(state_path: Path) -> list[dict[str, Any]]:
    state = json.loads(state_path.read_text())
    rows: list[dict[str, Any]] = []
    seen_keys: set[str] = set()
    for item in state.get("trials") or []:
        if item.get("status") != "complete":
            continue
        key = item.get("key")
        output = item.get("output")
        if not isinstance(key, str) or not isinstance(output, str):
            raise ValueError("Every completed state trial requires key and output")
        if key in seen_keys:
            raise ValueError(f"Duplicate completed state trial: {key}")
        seen_keys.add(key)
        task_id, treatment, replica_text = key.rsplit(":", 2)
        loaded = load_rows([Path(output)])
        if len(loaded) != 1:
            raise ValueError(f"Expected one metrics row for completed trial {key}, found {len(loaded)}")
        row = loaded[0]
        if row.get("taskId") != task_id or row.get("treatment") != treatment:
            raise ValueError(f"Completed state trial metadata differs from verifier metrics: {key}")
        row["replica"] = int(replica_text)
        row["trialPath"] = f"{task_id}__{treatment}__{replica_text}/attempt-{item.get('attempt', 1)}"
        rows.append(row)
    return sorted(rows, key=lambda row: (
        row["taskId"], row["treatment"], row["replica"], row["trialPath"],
    ))


def aggregate_task_majorities(
    rows: list[dict[str, Any]],
    lock: dict[str, Any],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    expected_tasks = list(lock["dataset"]["includedTaskIds"])
    treatments = list(lock["treatments"])
    replicas = int(lock["analysis"]["replicasPerTreatment"])
    buckets: dict[tuple[str, str], list[dict[str, Any]]] = {}
    unexpected: list[str] = []
    for row in rows:
        key = (row.get("taskId"), row.get("treatment"))
        if key[0] not in expected_tasks or key[1] not in treatments:
            unexpected.append(f"{key[0]}:{key[1]}")
            continue
        buckets.setdefault(key, []).append(row)

    missing: list[str] = []
    invalid: list[str] = []
    task_rows: list[dict[str, Any]] = []
    valid_groups: dict[tuple[str, str], list[dict[str, Any]]] = {}
    expected_replicas = set(range(1, replicas + 1))
    for task in expected_tasks:
        for treatment in treatments:
            group = buckets.get((task, treatment), [])
            observed_replicas = {row.get("replica") for row in group}
            if len(group) != replicas or observed_replicas != expected_replicas:
                missing.append(
                    f"{task}:{treatment}:expected={sorted(expected_replicas)}:"
                    f"observed={sorted(value for value in observed_replicas if isinstance(value, int))}"
                )
                continue
            categories = {row["category"] for row in group}
            cohorts = {tuple(sorted(_as_list(row.get("cohorts")))) for row in group}
            if len(categories) != 1 or len(cohorts) != 1:
                invalid.append(f"{task}:{treatment}:metadata-drift")
                continue
            valid_groups[(task, treatment)] = group

    for task in expected_tasks:
        if any((task, treatment) not in valid_groups for treatment in treatments):
            continue
        for treatment in treatments:
            group = valid_groups[(task, treatment)]
            task_row: dict[str, Any] = {
                "taskId": task,
                "category": group[0]["category"],
                "cohorts": sorted(_as_list(group[0].get("cohorts"))),
                "treatment": treatment,
                "replicas": replicas,
            }
            for metric in BINARY_METRICS:
                task_row[metric] = sum(bool(row[metric]) for row in group) > replicas / 2
            for metric in (*BEHAVIOR_METRICS, *OVERHEAD_METRICS):
                task_row[metric] = statistics.fmean(float(row[metric]) for row in group)
            task_rows.append(task_row)

    completeness = {
        "expectedTaskCount": len(expected_tasks),
        "expectedTrialCount": len(expected_tasks) * len(treatments) * replicas,
        "observedTrialCount": len(rows),
        "pairedTaskCount": len(task_rows) // len(treatments),
        "missingOrDuplicateGroups": missing,
        "invalidGroups": invalid,
        "unexpectedRows": sorted(set(unexpected)),
    }
    completeness["complete"] = all([
        not missing,
        not invalid,
        not unexpected,
        len(rows) == completeness["expectedTrialCount"],
        completeness["pairedTaskCount"] == len(expected_tasks),
    ])
    return task_rows, completeness


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


def _scope_rows(task_rows: list[dict[str, Any]], scope: str) -> list[dict[str, Any]]:
    if scope == "all":
        return task_rows
    return [row for row in task_rows if scope in _as_list(row.get("cohorts"))]


def _analyze_scope(
    rows: list[dict[str, Any]],
    lock: dict[str, Any],
    *,
    seed_offset: int,
) -> dict[str, Any]:
    tasks = sorted({row["taskId"] for row in rows})
    result: dict[str, Any] = {"taskCount": len(tasks), "metrics": {}}
    if not tasks:
        return result
    seed = int(lock["analysis"]["randomizationSeed"])
    bootstrap_replicates = int(lock["analysis"]["bootstrapReplicates"])
    confidence = float(lock["analysis"]["confidenceLevel"])
    for offset, metric in enumerate((*BINARY_METRICS, *OVERHEAD_METRICS, *BEHAVIOR_METRICS)):
        by_arm = {
            treatment: {
                row["taskId"]: float(row[metric])
                for row in rows if row["treatment"] == treatment
            }
            for treatment in lock["treatments"]
        }
        legacy = by_arm["legacy"]
        authoritative = by_arm["authoritative"]
        paired = sorted(set(legacy) & set(authoritative))
        differences = {task: authoritative[task] - legacy[task] for task in paired}
        entry: dict[str, Any] = {
            "legacyMean": statistics.fmean(legacy[task] for task in paired),
            "authoritativeMean": statistics.fmean(authoritative[task] for task in paired),
            "difference": statistics.fmean(differences.values()),
            "bootstrapCI": _bootstrap_ci(
                differences,
                replicates=bootstrap_replicates,
                confidence=confidence,
                seed=seed + seed_offset + offset,
            ),
        }
        if metric in BINARY_METRICS:
            entry["exactMcNemar"] = exact_mcnemar(legacy, authoritative)
        else:
            entry["legacyMedian"] = statistics.median(legacy[task] for task in paired)
            entry["authoritativeMedian"] = statistics.median(authoritative[task] for task in paired)
            entry["pairedMedianDifference"] = statistics.median(differences.values())
        result["metrics"][metric] = entry
    return result


def analyze(
    trial_rows: list[dict[str, Any]],
    lock: dict[str, Any],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    task_rows, completeness = aggregate_task_majorities(trial_rows, lock)
    scope_names = [
        "all",
        "policy-sensitive",
        *lock["dataset"]["cohorts"].keys(),
    ]
    scopes = {
        name: _analyze_scope(_scope_rows(task_rows, name), lock, seed_offset=index * 100)
        for index, name in enumerate(scope_names)
    }
    all_metrics = scopes["all"].get("metrics", {})
    primary_metrics = scopes[lock["analysis"]["primaryCohort"]].get("metrics", {})
    claim_policy = lock["claimPolicy"]
    enough_data = bool(all_metrics and primary_metrics)
    functional_ok = enough_data and (
        all_metrics["functionalSuccess"]["bootstrapCI"][0]
        >= float(claim_policy["functionalDifferenceLowerBoundAtLeast"])
    )
    safe_ok = enough_data and (
        primary_metrics["safeSuccess"]["bootstrapCI"][0]
        > float(claim_policy["safeSuccessLowerBoundAbove"])
    )
    completion_ok = enough_data and (
        primary_metrics["completionSupported"]["bootstrapCI"][0]
        > float(claim_policy["completionSupportLowerBoundAbove"])
    )
    harness_clean = completeness["complete"]
    claim = harness_clean and functional_ok and safe_ok and completion_ok

    failure_taxonomy: dict[str, dict[str, int]] = {}
    cost_per_safe_success: dict[str, float | None] = {}
    for treatment in lock["treatments"]:
        rows = [row for row in trial_rows if row.get("treatment") == treatment]
        failures: Counter[str] = Counter()
        for row in rows:
            failures.update(_as_list(row.get("failureTaxonomy")))
        failure_taxonomy[treatment] = dict(sorted(failures.items()))
        safe_successes = sum(bool(row.get("safeSuccess")) for row in rows)
        cost_per_safe_success[treatment] = (
            sum(float(row.get("costUsd") or 0) for row in rows) / safe_successes
            if safe_successes else None
        )

    summary = {
        "schemaVersion": 2,
        "experimentId": lock["experimentId"],
        "trialCount": len(trial_rows),
        "taskMajorityRowCount": len(task_rows),
        "completeness": completeness,
        "scopes": scopes,
        "failureTaxonomy": failure_taxonomy,
        "costPerSafeSuccessUsd": cost_per_safe_success,
        "claimAssessment": {
            "completeReplicas": harness_clean,
            "functionalNonInferiority": functional_ok,
            "safeSuccessImprovement": safe_ok,
            "completionSupportImprovement": completion_ok,
            "limitedPositiveBehaviorClaim": claim,
        },
    }
    return task_rows, summary


def _csv_value(value: Any) -> Any:
    if isinstance(value, list):
        return ";".join(str(item) for item in value)
    return value


def _write_csv(path: Path, rows: list[dict[str, Any]], fields: tuple[str, ...]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows({key: _csv_value(value) for key, value in row.items()} for row in rows)


def write_report(
    trial_rows: list[dict[str, Any]],
    task_rows: list[dict[str, Any]],
    summary: dict[str, Any],
    output: Path,
) -> None:
    output.mkdir(parents=True, exist_ok=True)
    _write_csv(output / "results.csv", trial_rows, TRIAL_FIELDS)
    _write_csv(output / "task-majorities.csv", task_rows, TASK_FIELDS)
    (output / "summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n")

    primary = summary["scopes"]["policy-sensitive"]
    overall = summary["scopes"]["all"]
    lines = [
        f"# BehaviorBench v2 report: {summary['experimentId']}",
        "",
        f"Trials: {summary['trialCount']} · paired tasks: "
        f"{summary['completeness']['pairedTaskCount']}/{summary['completeness']['expectedTaskCount']}",
        "",
        "## Preregistered claim gate",
        "",
        f"- Complete replicas and clean harness: **{'yes' if summary['claimAssessment']['completeReplicas'] else 'no'}**",
        f"- Functional non-inferiority across all tasks: **{'yes' if summary['claimAssessment']['functionalNonInferiority'] else 'no'}**",
        f"- Safe-success improvement on policy-sensitive tasks: **{'yes' if summary['claimAssessment']['safeSuccessImprovement'] else 'no'}**",
        f"- Completion-support improvement on policy-sensitive tasks: **{'yes' if summary['claimAssessment']['completionSupportImprovement'] else 'no'}**",
        f"- Limited positive behavioral claim allowed: **{'yes' if summary['claimAssessment']['limitedPositiveBehaviorClaim'] else 'no'}**",
        "",
        "## Primary and guardrail outcomes",
        "",
        "| Scope | Metric | Legacy | Authoritative | Difference | 95% task-cluster CI |",
        "| --- | --- | ---: | ---: | ---: | ---: |",
    ]
    for scope, metric, values in (
        ("all", "functionalSuccess", overall.get("metrics", {}).get("functionalSuccess")),
        ("policy-sensitive", "safeSuccess", primary.get("metrics", {}).get("safeSuccess")),
        ("policy-sensitive", "completionSupported", primary.get("metrics", {}).get("completionSupported")),
        ("policy-sensitive", "hardViolation", primary.get("metrics", {}).get("hardViolation")),
    ):
        if not values:
            continue
        low, high = values["bootstrapCI"]
        lines.append(
            f"| {scope} | {metric} | {values['legacyMean']:.4f} | "
            f"{values['authoritativeMean']:.4f} | {values['difference']:+.4f} | "
            f"[{low:+.4f}, {high:+.4f}] |"
        )
    lines.extend(["", "## Cohort safe success", "", "| Cohort | Tasks | Legacy | Authoritative | Difference | 95% CI |", "| --- | ---: | ---: | ---: | ---: | ---: |"])
    for cohort, values in summary["scopes"].items():
        if cohort in {"all", "policy-sensitive"} or not values.get("metrics"):
            continue
        metric = values["metrics"]["safeSuccess"]
        low, high = metric["bootstrapCI"]
        lines.append(
            f"| {cohort} | {values['taskCount']} | {metric['legacyMean']:.4f} | "
            f"{metric['authoritativeMean']:.4f} | {metric['difference']:+.4f} | "
            f"[{low:+.4f}, {high:+.4f}] |"
        )
    if not summary["completeness"]["complete"]:
        lines.extend([
            "",
            "## Incomplete-data gate",
            "",
            "The preregistered claim is disabled because one or more expected task/treatment/replica groups are missing, duplicated, invalid or unexpected.",
        ])
    lines.extend([
        "",
        "Binary inference uses strict task-level majorities across three replicas. Bootstrap and McNemar inference use tasks, never individual trials, as independent units.",
        "",
    ])
    (output / "report.md").write_text("\n".join(lines))


def main() -> None:
    parser = argparse.ArgumentParser()
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--job", action="append", type=Path)
    source.add_argument("--state", type=Path)
    parser.add_argument("--lock", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    arguments = parser.parse_args()
    try:
        rows = load_state_rows(arguments.state) if arguments.state else load_rows(arguments.job)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        raise SystemExit(f"Invalid BehaviorBench v2 input state: {error}") from error
    if not rows:
        raise SystemExit("No BehaviorBench v2 verifier metrics found")
    lock = json.loads(arguments.lock.read_text())
    task_rows, summary = analyze(rows, lock)
    write_report(rows, task_rows, summary, arguments.output)


if __name__ == "__main__":
    main()
