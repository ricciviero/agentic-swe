# Changelog

All notable changes to Agentic SWE are documented here. Package SemVer and protocol versions are independent; compatibility is listed in `COMPATIBILITY.md`.

## Unreleased

### Documentation

- Documented the public `interference-agent@0.6.0` consumer path and reference-host compatibility.

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
