# Changelog

All notable changes to Agentic SWE are documented here. Package SemVer and protocol versions are independent; compatibility is listed in `COMPATIBILITY.md`.

## Unreleased

### Added

- BehaviorBench: a Harbor-based paired harness comparing the same Interference build under `legacy` and Agentic SWE `authoritative` enforcement, with 12 deterministic repository tasks, independent verifiers, redacted host-neutral trajectories, fairness/lock gates, synthetic analysis tests, and sanitized JSON/CSV/Markdown reports.
- A secure Interference Harbor adapter that installs a digest-pinned source archive, transports provider credentials through a short-lived uploaded file instead of Harbor command literals or its persisted exec-environment payload, and exports ATIF-compatible redacted events without chain-of-thought.
- Offline `npm run benchmark:check` validation and CI coverage for dataset drift, treatment parity, experiment locks, analysis golden tests, adapter syntax, and report determinism.
- Release validation now handles npm's exact same-version dry-run refusal after a package is public, without masking unrelated publish failures or requiring a version bump for ordinary CI.

### Changed

- Required gate skills are now selected deterministically by the core: setup requires `agents-setup` and planning requires `iterations-planner`, even when a model router marks them irrelevant.
- Published the honest result of `behaviorbench-dsv4p-20260718-06`: equal observed functional success and better safety-oriented point estimates under authoritative enforcement, but confidence intervals that do not permit the preregistered general positive claim; current overhead is reported explicitly.

### Documentation

- Documented the public `interference-agent@0.7.0` consumer path, reference-host compatibility, BehaviorBench methodology, reproducibility boundary, limitations, and sanitized confirmatory output.

## 0.1.0 - 2026-07-16

### Added

- Agentic SWE Protocol v1 with JSON Schema contracts and normative conformance cases.
- Pure `@agenticswe/core` evaluator and read-only `@agenticswe/node` repository adapter.
- `@agenticswe/cli` commands for inspection, evaluation, verification, diagnostics, rendering, safe installation, and safe removal.
- Generated Codex/Claude adapters and project templates with drift checks.
- `@agenticswe/skills` manifest, integrity hashes, and read-only skill resolver.
- Node/Bun tarball smoke tests and public continuous integration.
- Host execution-event, evidence-claim, and completion-evaluation APIs in `@agenticswe/core`.
- Protocol 1.1 read-only request intent, preventing complex informational work from opening setup/planning gates or mutation capabilities.
- Complete npm metadata for every public workspace package, including monorepo source links and issue tracking.
- A maintainer-only release runbook covering npm scope access, dependency-ordered publication, partial releases, and clean public consumer verification.
- Finalized and published the public npm namespace as `@agenticswe/*`, matching the maintainer-owned `agenticswe` organization while keeping “Agentic SWE” as the framework name.
