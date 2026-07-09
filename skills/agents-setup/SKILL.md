---
name: agents-setup
description: Set up or align a code repository for coding agents using AGENTS.md as the canonical instruction file. Discover and map available global skills, propose project-specific skills, configure Codex and Claude Code adapters, and establish the iterations workflow. Use when bootstrapping a repository, aligning agent instructions, configuring Codex or Claude Code, or when asked for agents setup, AGENTS.md, project agent rules, or project skills.
---

# agents-setup

Set up a repository for coding agents without making any agent-specific file the source of truth.

## Core Contract

- Create or update `AGENTS.md` in English as the canonical, versioned instruction file.
- Treat `CLAUDE.md` as a minimal Claude Code adapter when it is needed; never maintain two independent constitutions.
- Store project-specific skills canonically in `.agents/skills/<skill-name>/`.
- Add `.codex/skills/` and `.claude/skills/` adapters only when the target agent requires a dedicated discovery path.
- Do not overwrite existing instructions or agent configuration before reading and reconciling them.

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
3. Select relevant global skills and record their triggers in `AGENTS.md`.
4. Identify reusable, project-specific knowledge. Propose project skills with a short rationale, then create only the skills the user accepts.
5. Establish the iterations workflow. Require `iterations-planner` before non-trivial work: multi-deliverable changes, behavior changes across layers, migrations, refactors, or underspecified client briefs. Skip it for clearly mechanical microtasks.
6. Offer optional requirements, decision-log, memory, and operational README structures without inventing project facts.
7. Add only the Codex and Claude Code adapters that are necessary for the selected setup.

## Rules for `AGENTS.md`

Keep it concise and operational. Include:

- project purpose, stack, and boundaries;
- selected global skills with trigger-oriented mapping;
- canonical project-skill location and adapter paths;
- iteration protocol and the local/gitignored status of `iterazioni/`;
- documentation, validation, and security rules that are specific to the repository.

Do not embed a static global-skill catalog. Refresh the mapping when the repository's needs or installed skills change.

## Project Skills

Create a project skill only for durable, repeated knowledge that is specific to the repository and is not already covered by a global skill. Use `SKILL.md` with `name` and `description` frontmatter. Keep the canonical source in `.agents/skills/`; link or mirror it for Codex and Claude Code only when their discovery behavior requires it.

Use `skill-creator` for a Codex-compatible project skill when it is available.

## Validation

Verify that `AGENTS.md` is internally coherent, adapter files point to it rather than duplicate it, selected skills exist, project-skill paths resolve, and local-only iteration or memory directories are ignored when requested. Do not claim a tool-specific behavior without checking the installed agent's documentation or configuration.
