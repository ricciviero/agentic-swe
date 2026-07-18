# BehaviorBench confirmatory design: 20260718-07

This directory contains the preregistered machine-readable design for the independent BehaviorBench
v2 study. It is not a result directory.

- `benchmark-lock.json` freezes the causal contrast, model, cohorts, replication, power assumptions,
  claim thresholds, budget and publication boundary.
- `arms.json` describes the shared execution settings and the only permitted arm difference.

## Invalidation

This experiment is closed and contributes no confirmatory result. Three trials completed and a
fourth was interrupted after the first real run showed a construct-validity defect: some
behavior-only tasks required source text identical to the canonical solution even when the agent's
alternative implementation satisfied the requested behavior and its tests. Continuing would have
measured solution form rather than functional behavior.

Paid calls were disabled, the remaining container was stopped, and observed spend was USD 0.06.
The replacement experiment is `behaviorbench-dsv4p-20260718-08`; it uses semantic behavior checks,
replaces every exposed or in-flight task, and does not import any `-07` result into its analysis.
