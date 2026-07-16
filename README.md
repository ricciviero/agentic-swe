# agentic-swe

An open behavior framework for software-engineering agents: a versioned protocol, a reference runtime, reusable skills, and compatibility adapters.

`agentic-swe` separates persistent behavior from task-specific procedures and host implementation:

- `protocol/v1/` is the normative, machine-readable behavioral contract.
- `packages/core/` is the pure TypeScript evaluator and state machine.
- `packages/node/` is the read-only repository adapter for Node.js and Bun hosts.
- `packages/cli/` is the installable `agentic-swe` command-line interface.
- `packages/skills/` distributes the public skill catalog with an integrity manifest.
- `core/agentic-protocol.md` is the concise compatibility adapter loaded by prompt-driven agents.
- `AGENTS.md` is the canonical, versioned contract for each configured repository.
- `.agentic/config.yaml` records active agents, selected skills, and local workflow paths.
- Skills provide detailed workflows, templates, and references only after the core has routed the task to them.
- Hosts such as terminal agents retain their own models, tools, permission enforcement, sessions, and UI.

The framework currently supports OpenAI Codex and Claude Code while keeping project governance portable through `AGENTS.md`.

## Quick Start

From a source checkout:

```bash
npm install
npm run build
node packages/cli/dist/bin.js inspect .
node packages/cli/dist/bin.js verify .
```

The package names are reserved in the workspace as `@agenticswe/core`, `@agenticswe/node`, `@agenticswe/skills`, and `@agenticswe/cli`. They are release-candidate artifacts until an explicitly authorized registry publication; do not assume npm availability before a release is announced.

[Interference](https://github.com/ricciviero/interference) is the first reference host: it integrates the framework as an authoritative behavior runtime while retaining ownership of models, tools, permissions, sessions, and terminal UI. The framework remains a separate repository and can be adopted by other coding-agent hosts.

## Operating Model

At session start, the protocol makes the workflow decision before implementation:

1. Read repository instructions and `.agentic/config.yaml` when present.
2. Route unconfigured onboarding or non-trivial work to `agents-setup`.
3. Classify the request and its mutation intent. Non-trivial mutating work must pass through `iterations-planner` before editing; read-only questions never gain mutation capabilities.
4. Use only the project-selected global skills that match the task.
5. Validate the changed surface and report evidence before completion.

`agents-setup` is the bootstrap and migration procedure. `iterations-planner` owns local task, plan, bug, and fix records. They are no longer the only place where the workflow decision lives.

## Framework and Host Boundary

Agentic SWE is the behavioral core, not a complete coding agent and not a system-prompt bundle. It owns the portable decisions that should remain stable across hosts:

- task classification and mutation intent;
- setup, planning, verification, and completion gates;
- requested capabilities and deny-wins intersection semantics;
- skill routing, structured events, evidence, resumable state, and conformance cases.

A host owns execution and product experience:

- model selection, tool implementations, permission prompts, and external side effects;
- session storage, redaction, terminal or graphical UI, streaming, and interruption;
- the final enforcement decision, which may restrict protocol requests but can never be elevated by them.

The integration contract is a typed `BehaviorInput → BehaviorPlan` evaluation plus host-owned execution events. This makes behavior testable independently of a model prompt and lets multiple agent products implement the same protocol without sharing their UI or tool stack.

## Protocol v1

[`protocol/v1/protocol.yaml`](protocol/v1/protocol.yaml) defines phases, legal transitions, abstract capabilities, mutation intent, gates, completion criteria, reason codes, and the learning loop. JSON Schema files define serialized project configuration, evaluation inputs, behavior plans, events, and resumable state. Normative conformance cases cover configured and unconfigured repositories, trivial and non-trivial work, read-only requests, uncertainty, explicit planning waivers, verification, completion, incompatible configuration, and repeated-learning signals.

The key security boundary is explicit: a model may classify intent or propose actions, but it never grants capabilities. A host computes effective access by intersecting protocol requests with its own permission policy and the user's selected mode; any deny wins.

The existing Markdown core remains compatible for Codex and Claude Code. It and the project templates are generated from the protocol source; `npm run generate:check` rejects drift.

## Reference Runtime

`@agenticswe/core` evaluates a typed request into a deterministic `BehaviorPlan`, validates state transitions, intersects capabilities, validates classifier/skill-router ports, serializes resumable state, and reconciles host execution events into completion evidence. It has no runtime dependencies and performs no I/O. Event subjects are host-redacted metadata: file contents, command output, credentials, and model transcripts do not belong in the core event log.

`@agenticswe/node` discovers repository instructions and configuration, validates YAML against the v1 schema, inventories approved skills, verifies planning evidence, and composes the core. Inspection and evaluation are read-only: hosts remain responsible for models, permission enforcement, persistence, and every mutating action.

To build and exercise the public APIs locally:

```bash
npm install
npm run typecheck
npm test
npm run pack:check
npm run release:check
```

The last command creates local tarballs in a temporary directory, installs all four packages into isolated Node and Bun consumers, runs the public APIs and CLI, inspects package contents, and deletes the temporary artifacts.
`release:check` inspects each public workspace through a deterministic npm pack dry-run, then exercises its publish dry-run, rejects manifest auto-corrections and unexpected npm warnings, and never creates a registry release. The single authentication warning emitted by an unauthenticated registry dry-run is expected in ordinary CI and does not hide other warnings.

## CLI

The CLI keeps read-only inspection separate from explicit mutation:

```bash
agentic-swe inspect <repo> [--json]
agentic-swe evaluate <repo> --request-file request.json
agentic-swe verify <repo>
agentic-swe doctor
agentic-swe render project-config
agentic-swe install --target all --dry-run
agentic-swe uninstall --target all --dry-run
```

`inspect`, `evaluate`, `verify`, and `doctor` do not mutate repositories. `render --output`, `install`, and `uninstall` use generated ownership markers, refuse unexpected symlinks or unowned files, and expose `--dry-run` and `--json`. See [`COMPATIBILITY.md`](COMPATIBILITY.md) for the protocol/package matrix and package support policy.

## Install

The preferred released installation will use the CLI package. From a source checkout, build once and use the compatibility wrappers:

```bash
git clone https://github.com/ricciviero/agentic-swe.git
cd agentic-swe
npm install
npm run build

bash scripts/install-agentic-core.sh all --dry-run
bash scripts/install-agentic-core.sh all
bash scripts/link-skills.sh codex
bash scripts/link-skills.sh claude
```

The core installer is non-destructive:

- Codex receives a managed block in `${CODEX_HOME:-~/.codex}/AGENTS.md`. Existing personal instructions remain intact; rerun the installer after pulling core changes.
- Claude Code receives an entirely owned rule at `${CLAUDE_HOME:-~/.claude}/rules/agentic-swe.md`; unowned files and unexpected symlinks are refused.

The skill linker remains a source-checkout compatibility entry point and never overwrites an existing skill. Package consumers should resolve metadata and bodies through `@agenticswe/skills`, which avoids cloning or embedding the catalog. Use `--dry-run` before either installer and `agentic-swe uninstall --target all` to remove only owned global adapters.

## Project Bootstrap

In a target repository, use `agents-setup`. It reconciles existing instructions and creates or updates:

```text
AGENTS.md                Canonical project instructions
.agentic/config.yaml     Active agents, selected skills, workflow paths
CLAUDE.md                Thin Claude Code adapter importing AGENTS.md
.agents/skills/          Canonical project-specific skills when needed
```

The project manifest selects only skills relevant to that repository. It also declares the local iteration and fix directories, which remain gitignored by default. Run the portable verifier after changing the setup:

```bash
agentic-swe verify .
```

## Included Skills

The public bundle currently contains 40 skills across frontend and mobile development, backend and cloud engineering, agent workflows, delivery automation, and design engineering. Browse [`skills/`](skills/) for the full collection.

Personal or machine-specific skills are intentionally excluded from this public bundle, including `ericsson-reports`, `improve-aura`, `melix-llm-lab`, `obsidian-bases`, `telegram-deploy-notify`, and `vps-github-autodeploy`.

Notable workflow skills:

- `agents-setup`: bootstraps or migrates a repository into the Agentic SWE contract and creates the focused skill map.
- `iterations-planner`: executes the required planning workflow for non-trivial features, refactors, migrations, and fixes.
- `skill-creator`: supplied by Codex rather than bundled here; use it when creating or materially revising a Codex skill.

## Repository Layout

```text
protocol/               Normative protocol definitions, schemas, and conformance cases
packages/core/          Pure evaluator, state machine, ports, capability policy, state serialization
packages/node/          Read-only repository/config/skill/evidence adapter
packages/cli/           CLI for inspect/evaluate/verify/render/install/uninstall
packages/skills/        Generated manifest API and packaged public skill assets
core/                   Global protocol and project-contract templates
skills/                 Canonical reusable skill directories
scripts/                Generation, package smoke tests, and compatibility wrappers
AGENTS.md               Contributor instructions for this repository
THIRD_PARTY_NOTICES.md  Licenses that apply to bundled third-party material
```

## Contributing

Keep all new repository content in English. Do not commit credentials, private machine paths, customer information, or material that cannot be published under a compatible license. Validate changed Codex skills with the `skill-creator` validator before opening a change. See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md).

A protocol behavior change must update `protocol.yaml`, affected schemas, at least one conformance case, the v1 specification, generated runtime assets, and any compatibility adapter whose visible semantics changed. Runtime changes must pass typecheck, unit/integration tests, all normative conformance cases, and Node/Bun package smoke tests.

## Releasing

Release preparation is automated and non-publishing; registry publication remains a manual maintainer action. See [`RELEASING.md`](RELEASING.md) for npm scope prerequisites, the verified package order, partial-release handling, and public consumer checks. Publishing Agentic SWE does not publish or release any host such as Interference.

## License

This repository is licensed under the MIT License. Some bundled assets remain under their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
