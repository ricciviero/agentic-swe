# agentic-swe

A public, agent-agnostic operating model and skill collection for coding agents.

`agentic-swe` separates persistent behavior from task-specific procedures:

- `core/agentic-protocol.md` is the concise routing policy loaded at the start of every session.
- `AGENTS.md` is the canonical, versioned contract for each configured repository.
- `.agentic/config.yaml` records active agents, selected skills, and local workflow paths.
- Skills provide detailed workflows, templates, and references only after the core has routed the task to them.

The package currently supports OpenAI Codex and Claude Code while keeping project governance portable through `AGENTS.md`.

## Operating Model

At session start, the core makes the workflow decision before implementation:

1. Read repository instructions and `.agentic/config.yaml` when present.
2. Route unconfigured onboarding or non-trivial work to `agents-setup`.
3. Classify the request. Non-trivial work must pass through `iterations-planner` before editing.
4. Use only the project-selected global skills that match the task.
5. Validate the changed surface and report evidence before completion.

`agents-setup` is the bootstrap and migration procedure. `iterations-planner` owns local task, plan, bug, and fix records. They are no longer the only place where the workflow decision lives.

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

The public bundle currently contains 38 skills across frontend and mobile development, backend and cloud engineering, agent workflows, delivery automation, and design engineering. Browse [`skills/`](skills/) for the full collection.

Personal or machine-specific skills are intentionally excluded from this public bundle, including `ericsson-reports`, `improve-aura`, `melix-llm-lab`, `obsidian-bases`, `telegram-deploy-notify`, and `vps-github-autodeploy`.

Notable workflow skills:

- `agents-setup`: bootstraps or migrates a repository into the Agentic SWE contract and creates the focused skill map.
- `iterations-planner`: executes the required planning workflow for non-trivial features, refactors, migrations, and fixes.
- `skill-creator`: supplied by Codex rather than bundled here; use it when creating or materially revising a Codex skill.

## Repository Layout

```text
core/                   Global protocol and project-contract templates
skills/                 Canonical reusable skill directories
scripts/                Core installation, project verification, skill linking
AGENTS.md               Contributor instructions for this repository
THIRD_PARTY_NOTICES.md  Licenses that apply to bundled third-party material
```

## Contributing

Keep all new repository content in English. Do not commit credentials, private machine paths, customer information, or material that cannot be published under a compatible license. Validate changed Codex skills with the `skill-creator` validator before opening a change.

## License

This repository is licensed under the Apache License 2.0. Some bundled assets remain under their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
