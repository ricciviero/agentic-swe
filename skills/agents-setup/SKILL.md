---
name: agents-setup
description: Bootstrap or migrate a repository into the Agentic SWE operating model. Create a canonical AGENTS.md, a versioned .agentic/config.yaml manifest, a minimal Claude Code adapter, a focused global-skill map, and the non-trivial-work planning gate. Use when onboarding a repository for coding agents, aligning agent instructions, configuring Codex or Claude Code, or establishing project skills and workflow rules.
---

# agents-setup

Bootstrap a repository into the Agentic SWE operating model without making any agent-specific file the source of truth.

## Core Contract

- Create or update `AGENTS.md` in English as the canonical, versioned instruction file.
- Create or update the versioned `.agentic/config.yaml` manifest. It records active agents, selected global skills, project-skill location, and local workflow paths.
- Treat `CLAUDE.md` as a minimal Claude Code adapter that imports `AGENTS.md`; never maintain two independent constitutions.
- Store project-specific skills canonically in `.agents/skills/<skill-name>/`.
- Add `.codex/skills/` and `.claude/skills/` adapters only when the target agent requires a dedicated discovery path.
- Do not overwrite existing instructions or agent configuration before reading and reconciling them.

The global Agentic SWE protocol routes unconfigured non-trivial work here. This skill performs the bootstrap procedure; it is not the always-loaded behavior layer.

## Discover First

Before writing, inspect the repository, existing `AGENTS.md` and `CLAUDE.md`, relevant agent directories, `.gitignore`, documentation, and the project stack.

Discover global skills from these locations when present, in this order:

1. `$AGENTIC_SWE_HOME/skills`
2. `${CODEX_HOME:-~/.codex}/skills`
3. `${CLAUDE_HOME:-~/.claude}/skills`

Read each candidate's `SKILL.md` frontmatter, deduplicate by `name`, and use its `description` as the initial trigger text. Map only skills relevant to the project; do not dump the entire global inventory into `AGENTS.md`.

Read [references/project-bootstrap.md](references/project-bootstrap.md) for the interview, templates, migration procedure, and adapter details.

## Setup Flow

1. Establish the project purpose, stack, operational boundaries, and active coding agents.
2. Reconcile existing instructions into one canonical `AGENTS.md`; preserve existing files unless the user approves their removal.
3. Create or reconcile `.agentic/config.yaml` from the generated Agentic SWE template. Record only the selected global skills and concrete triggers; do not add keys outside the published v1 schema.
4. Add the `Agentic Workflow` section to `AGENTS.md`, including the planning gate and validation expectations.
5. Create `CLAUDE.md` with an `@AGENTS.md` import when Claude Code is active. Preserve any substantive Claude-specific rules below the import.
6. Identify reusable, project-specific knowledge. Propose project skills with a short rationale, then create only the skills the user accepts.
7. Establish the iterations workflow. `iterations-planner` is required before non-trivial work: multi-deliverable changes, behavior changes across layers, migrations, refactors, or underspecified client briefs. Skip it for clearly mechanical microtasks.
8. Offer optional requirements, decision-log, memory, and operational README structures without inventing project facts.
9. Add only the Codex and Claude Code discovery adapters that are necessary for the selected setup.

## Rules for `AGENTS.md`

Keep it concise and operational. Include:

- project purpose, stack, and boundaries;
- selected global skills with trigger-oriented mapping;
- `.agentic/config.yaml` as the machine-readable source for the selected-skill map and workflow paths;
- canonical project-skill location and adapter paths;
- iteration protocol and the local/gitignored status of `iterazioni/`;
- documentation, validation, and security rules that are specific to the repository.

Do not embed a static global-skill catalog. Refresh the mapping when the repository's needs or installed skills change.

## Project Skills

Create a project skill only for durable, repeated knowledge that is specific to the repository and is not already covered by a global skill. Use `SKILL.md` with `name` and `description` frontmatter. Keep the canonical source in `.agents/skills/`; link or mirror it for Codex and Claude Code only when their discovery behavior requires it.

Use `skill-creator` for a Codex-compatible project skill when it is available.

## Validation

Run `agentic-swe verify <project-root>` when the Agentic SWE CLI is available. The compatibility wrapper `scripts/verify-agentic-project.sh` may be used from a source checkout. Use `agentic-swe render project-config`, `project-agents-section`, and `project-claude` when generating canonical templates rather than maintaining local copies. Otherwise verify that `AGENTS.md` is internally coherent, `CLAUDE.md` imports it rather than duplicating it, selected skills exist, project-skill paths resolve, and local-only iteration or memory directories are ignored when requested. Do not claim a tool-specific behavior without checking the installed agent's documentation or configuration.
