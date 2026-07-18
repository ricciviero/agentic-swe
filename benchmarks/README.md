# Agentic SWE BehaviorBench

BehaviorBench measures the incremental effect of enabling Agentic SWE inside the same coding-agent host. It is not a general model leaderboard and it does not compare unrelated agents.

The only experimental contrast is:

- `legacy`: Interference runs with its Agentic SWE enforcement disabled.
- `authoritative`: the same Interference build runs with Agentic SWE authoritative enforcement.

Harbor provides clean containers, task lifecycle management and result collection. Prompt, workspace, model, reasoning level, tools, permissions and timeouts stay identical between treatments.

## Reproducibility boundary

- Method and claim policy: [`methodology.md`](methodology.md)
- Machine-readable experiment pin: [`benchmark-lock.json`](benchmark-lock.json)
- Harbor adapter and task dataset: `harbor/`
- Deterministic normalization and analysis: `analysis/`
- Sanitized manifests and reports: `results/`

Raw Harbor jobs, provider credentials, complete trajectories and sealed task material remain local and are gitignored. Publishing datasets or results is a separate maintainer decision.

## Offline validation

From the repository root:

```bash
npm install
npm run benchmark:check
```

This regenerates the dataset in check mode, verifies the exact dataset/verifier/container lock,
compares both treatment manifests, exercises scorer and report golden tests, and compiles all Python
surfaces. CI runs the same command without provider access. Docker/Harbor smoke runs are maintainer
evidence because the public CI job intentionally has no paid credential.

The confirmatory runner is serial and resumable, checks the live DeepSeek balance before and after
every task, validates the Interference tarball digest, and refuses paid work when
`benchmark-lock.json#budget.paidCallsAllowed` is false. It is currently locked. Reopening it
requires a new explicit budget authorization and a new experiment ID; do not reuse the completed
run's thresholds or task set for a new claim.

## Completed experiment

[`behaviorbench-dsv4p-20260718-06`](results/behaviorbench-dsv4p-20260718-06/) completed all 24
trials across 12 paired task clusters with DeepSeek V4 Pro at max reasoning. The two arms had equal
observed functional success (`83.3%`). Authoritative enforcement had better descriptive point
estimates for safe success, hard violations, supported completion, and policy compliance, but the
task-cluster confidence intervals did not establish the preregistered functional non-inferiority,
safe-success improvement, or completion-support improvement together. Therefore no general
positive claim is allowed.

Mean authoritative overhead was approximately `$0.0135` per task, `110.8 s`, `22.6` tool calls,
and `150k` input tokens. The confirmatory comparison consumed about `$0.20`; total balance movement
observed across development pilots, diagnostics, and confirmatory work was about `$0.35`, below the
maintainer's EUR 10 authorization. Planning recall improved but planning precision and skill-routing
F1 declined; estimated cost per safe success was `$0.0305` for authoritative and `$0.0104` for
legacy. Read the result directory for limitations, failure counts, and task-level rows.

## Preregistered follow-up

`behaviorbench-dsv4p-20260718-07` is a separate, currently locked confirmatory study. It preserves
the completed v1 corpus and scorer unchanged, and introduces 60 new policy-sensitive tasks plus 12
neutral controls. Each treatment receives three replicas per task; binary outcomes are reduced to
a task-level majority before paired inference. The primary endpoint is safe success on the 60
policy-sensitive tasks, with functional non-inferiority across all 72 tasks as a guardrail.

The design, power assumptions, missing-data policy and USD 5 additional operational cap live under
[`experiments/behaviorbench-dsv4p-20260718-07/`](experiments/behaviorbench-dsv4p-20260718-07/).
All offline gates are now complete: the 72 tasks passed two clean oracle runs (144 containers), the
Interference archive installed in the pinned image, the Harbor agent-to-verifier smoke passed, the
432-trial schedule dry-run created no state, and dataset/verifier/analysis/runner/archive hashes are
sealed. Paid calls remain disabled until a rotated DeepSeek credential is available. The study is
valid even if it rejects the proposed behavioral improvement.

## Safety

Paid runs must pass the lock, fairness, oracle, redaction and budget preflights. The current authorization is capped at EUR 10, while the operational USD cap is deliberately lower and must also fit the live provider balance. A failed or negative experiment is valid output; the harness must never tune the corpus after seeing treatment results.

Provider keys are uploaded into the trial container as a temporary file, read immediately before
the agent starts, and removed before execution. They must never appear in a process command,
persisted environment, trajectory, report, or versioned file.
