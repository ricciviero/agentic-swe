# agentic-swe

An open behavior framework for software-engineering agents: a versioned protocol, a reference runtime, reusable skills, and compatibility adapters.

`agentic-swe` separates persistent behavior from task-specific procedures and host implementation:

- `protocol/v1/` is the normative, machine-readable behavioral contract.
- `packages/core/` is the pure TypeScript evaluator and state machine.
- `packages/node/` is the read-only repository adapter for Node.js and Bun hosts.
- `core/agentic-protocol.md` is the concise compatibility adapter loaded by prompt-driven agents.
- `AGENTS.md` is the canonical, versioned contract for each configured repository.
- `.agentic/config.yaml` records active agents, selected skills, and local workflow paths.
- Skills provide detailed workflows, templates, and references only after the core has routed the task to them.
- Hosts such as terminal agents retain their own models, tools, permission enforcement, sessions, and UI.

The package currently supports OpenAI Codex and Claude Code while keeping project governance portable through `AGENTS.md`.

## Operating Model

At session start, the protocol makes the workflow decision before implementation:

1. Read repository instructions and `.agentic/config.yaml` when present.
2. Route unconfigured onboarding or non-trivial work to `agents-setup`.
3. Classify the request. Non-trivial work must pass through `iterations-planner` before editing.
4. Use only the project-selected global skills that match the task.
5. Validate the changed surface and report evidence before completion.

`agents-setup` is the bootstrap and migration procedure. `iterations-planner` owns local task, plan, bug, and fix records. They are no longer the only place where the workflow decision lives.

## Protocol v1

[`protocol/v1/protocol.yaml`](protocol/v1/protocol.yaml) defines phases, legal transitions, abstract capabilities, gates, completion criteria, reason codes, and the learning loop. JSON Schema files define serialized project configuration, evaluation inputs, behavior plans, events, and resumable state. Normative conformance cases cover configured and unconfigured repositories, trivial and non-trivial work, uncertainty, explicit planning waivers, verification, completion, incompatible configuration, and repeated-learning signals.

The key security boundary is explicit: a model may classify intent or propose actions, but it never grants capabilities. A host computes effective access by intersecting protocol requests with its own permission policy and the user's selected mode; any deny wins.

The existing Markdown core remains compatible for Codex and Claude Code. The TypeScript reference runtime evaluates the same contract; generated prompt adapters remain a later distribution layer and do not change the repository's agent-agnostic boundary.

## Reference Runtime

`@agentic-swe/core` evaluates a typed request into a deterministic `BehaviorPlan`, validates state transitions, intersects capabilities, validates classifier/skill-router ports, and serializes resumable state. It has no runtime dependencies and performs no I/O.

`@agentic-swe/node` discovers repository instructions and configuration, validates YAML against the v1 schema, inventories approved skills, verifies planning evidence, and composes the core. Inspection and evaluation are read-only: hosts remain responsible for models, permission enforcement, persistence, and every mutating action.

The packages are currently consumed from this workspace; registry publication belongs to the distribution iteration. To build and exercise the public API locally:

```bash
npm install
npm run typecheck
npm test
npm run pack:check
```

The last command creates local tarballs in a temporary directory, installs both packages into isolated Node and Bun consumers, runs the public API, inspects package contents, and deletes the temporary artifacts.

## Install

Clone the repository in a stable location, then install the global routing core and whichever skill directories you use:

```bash
git clone https://github.com/ricciviero/agentic-swe.git
cd agentic-swe

bash scripts/install-agentic-core.sh all
bash scripts/link-skills.sh codex
bash scripts/link-skills.sh claude
```

The core installer is non-destructive:

- Codex receives a managed block in `${CODEX_HOME:-~/.codex}/AGENTS.md`. Existing personal instructions remain intact; rerun the installer after pulling core changes.
- Claude Code receives a symlinked user rule at `${CLAUDE_HOME:-~/.claude}/rules/agentic-swe.md`, so pulls update the loaded protocol immediately.

The skill linker never overwrites an existing skill. Resolve any reported conflict deliberately, then rerun it. Use `--dry-run` with either installer to inspect its actions first.

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
path/to/agentic-swe/scripts/verify-agentic-project.sh .
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
core/                   Global protocol and project-contract templates
skills/                 Canonical reusable skill directories
scripts/                Core installation, project verification, skill linking
AGENTS.md               Contributor instructions for this repository
THIRD_PARTY_NOTICES.md  Licenses that apply to bundled third-party material
```

## Contributing

Keep all new repository content in English. Do not commit credentials, private machine paths, customer information, or material that cannot be published under a compatible license. Validate changed Codex skills with the `skill-creator` validator before opening a change.

A protocol behavior change must update `protocol.yaml`, affected schemas, at least one conformance case, the v1 specification, generated runtime assets, and any compatibility adapter whose visible semantics changed. Runtime changes must pass typecheck, unit/integration tests, all normative conformance cases, and Node/Bun package smoke tests.

## License

This repository is licensed under the MIT License. Some bundled assets remain under their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
