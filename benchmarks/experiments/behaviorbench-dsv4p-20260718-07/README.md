# BehaviorBench confirmatory design: 20260718-07

This directory contains the preregistered machine-readable design for the independent BehaviorBench
v2 study. It is not a result directory.

- `benchmark-lock.json` freezes the causal contrast, model, cohorts, replication, power assumptions,
  claim thresholds, budget and publication boundary.
- `arms.json` describes the shared execution settings and the only permitted arm difference.

`paidCallsAllowed` is still `false`. Dataset, verifier, analysis, runner/adapter and Interference
archive hashes are sealed; 144 oracle containers, package installation, Harbor smoke and the
432-trial dry-run are green. The remaining paid gate is a rotated DeepSeek credential. Completed
sanitized output will live under `benchmarks/results/behaviorbench-dsv4p-20260718-07/`.
