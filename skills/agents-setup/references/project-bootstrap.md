# Project Bootstrap Reference

Use this reference when performing a full setup, reconciling existing instructions, or creating project-skill adapters. Keep `AGENTS.md` canonical throughout.

## Setup Interview

Collect only information that cannot be reliably inferred from the repository:

1. Project name, purpose, users, and boundaries.
2. Active stack, tooling, deployment environment, and data or security constraints.
3. Which agents must work in the repository: Codex, Claude Code, or both.
4. Whether requirements, a decision log, project memory, and an operational README are wanted.
5. Which folders must remain local and gitignored.

Inspect the codebase before asking questions that its files already answer. Do not invent product facts, deployment details, or ownership rules.

## Global Skill Discovery

Look for global skills in the following locations when they exist:

```text
$AGENTIC_SWE_HOME/skills
${CODEX_HOME:-~/.codex}/skills
${CLAUDE_HOME:-~/.claude}/skills
```

For every directory containing `SKILL.md`, read only the `name` and `description` frontmatter first. De-duplicate by skill name, preferring the earlier location in the list. Then select the smallest useful set for the repository.

Examples of focused mappings:

| Project context | Relevant global skills |
| --- | --- |
| Next.js product | `nextjs-frontend`, `frontend-design`, `iterations-planner` |
| NestJS API | `nestjs-best-practices`, `docker-environments`, `iterations-planner` |
| AWS-hosted service | `aws`, `server-hardening` |
| Design-heavy web app | `frontend-design`, `ui-ux-pro-max`, `apple-design`, `emil-design-eng` |

Do not list a skill merely because it is installed. Record a concise, project-relevant trigger beside each selected skill.

## Canonical File and Adapters

`AGENTS.md` is the only complete project constitution. It must be versioned with the repository. `.agentic/config.yaml` is its machine-readable companion for agent selection, skill mapping, and local workflow paths.

Render these canonical templates when the Agentic SWE CLI is available:

```bash
agentic-swe render project-config
agentic-swe render project-agents-section
agentic-swe render project-claude
```

The tracked files under `core/templates/` are generated compatibility outputs for source checkouts. Do not edit them directly.

When only this skill is installed, create the equivalent concise files directly. Do not add unsupported configuration keys or invent project facts.

When Claude Code is active, create a short adapter that imports `AGENTS.md`:

```markdown
# Claude Code Adapter

@AGENTS.md

Add only Claude Code-specific notes below this line. Do not duplicate project rules here.
```

When an existing `CLAUDE.md` contains substantive instructions, merge them into `AGENTS.md` before replacing it with an adapter. Do not delete the original without explicit approval.

## Canonical Project Skills

Use this layout for project-specific skills:

```text
.agents/
  skills/
    domain-workflow/
      SKILL.md
```

When a dedicated discovery path is needed, link the canonical directory rather than maintaining a second copy:

```text
.codex/skills/domain-workflow  -> ../../.agents/skills/domain-workflow
.claude/skills/domain-workflow -> ../../.agents/skills/domain-workflow
```

Create the adapter only for an agent that is actually used in the repository. Add each generated adapter path to `.gitignore` only if the project chooses to keep adapters local; otherwise version it as part of the shared agent setup.

Use this project-skill template:

```markdown
---
name: domain-workflow
description: Describe the project-specific workflow and concrete triggers that should activate it.
---

# Domain Workflow

State only the non-obvious, reusable procedure and project constraints.
Link to project-owned references or scripts when they are required.
```

## Agentic Manifest

Create `.agentic/config.yaml` with these durable fields:

```yaml
version: 1
agents:
  - codex
  - claude-code
project_skills_dir: .agents/skills
selected_skills:
  - name: frontend-design
    trigger: Build or revise a user-facing web interface.
workflow:
  planning_gate: non-trivial
  iteration_directory: iterazioni
  fix_directory: fix
  local_workspaces_gitignored: true
```

Use only active agents and selected skills. Keep the paths relative to the repository root. `AGENTS.md` explains the policy; this file supplies the stable values tools and agents can inspect.

## Iteration Protocol

Use `iterations-planner` before work that has any of these characteristics:

- more than one independently testable deliverable;
- a user-facing change spanning frontend and backend;
- a migration, refactor, or deployment change;
- a client brief with unclear sequencing or acceptance criteria;
- a task that needs deliberate trade-off or scope tracking.

The planner owns `iterazioni/`. Keep it local and gitignored unless the repository explicitly needs a committed planning record. Do not require it for a one-line correction, a safe rename, or another clearly mechanical microtask.

## Optional Structures

Offer these only when their value is clear:

```text
docs/requirements.md       Product or technical requirements
.agents/decisions/         On-demand architecture decision records
.agents/memory/            Current state and non-obvious operational facts
README.md                  Human setup and operation guide
```

Decision records are on-demand. Create one only when the user asks to record a non-trivial decision. Project memory must describe current, actionable state rather than restating source code.

## `AGENTS.md` Template

```markdown
# Project Name

Canonical instructions for coding agents working in this repository.

## Project

- Purpose: <one sentence>
- Stack: <languages, frameworks, infrastructure>
- Boundaries: <security, data, deployment, or ownership constraints>

## Global Skills

| Trigger | Skill |
| --- | --- |
| <project-specific trigger> | `<skill-name>` |

## Project Skills

Canonical source: `.agents/skills/`.

Create or update a project skill only for repeated knowledge that is specific to this repository and not already covered by a global skill.

## Agentic Workflow

Read `.agentic/config.yaml` before selecting skills or creating local workflow records.

- For non-trivial work, use `iterations-planner` before editing.
- Local plans and fixes use the configured directories and remain gitignored unless this repository explicitly says otherwise.
- Treat the selected-skill mapping as the project-approved global-skill map.
- Run the validation commands required by the changed surface before reporting completion.

## Delivery Rules

- Read the relevant project documentation before changing behavior.
- Preserve security boundaries and validate inputs at the appropriate layer.
- Run checks that match the changed surface before declaring work complete.
- Keep code and its corresponding documentation aligned.
```

Add only project-specific rules. Do not paste generic coding advice or a complete catalog of every installed skill.

## Validation Checklist

- `AGENTS.md` exists, is versioned, and has no conflicting canonical document.
- `.agentic/config.yaml` exists, records active agents and workflow paths, and matches `AGENTS.md`.
- `CLAUDE.md`, if present, imports `AGENTS.md` and contains only Claude-specific notes.
- Every mapped global skill exists in one of the discovered locations.
- Every project-skill adapter resolves to `.agents/skills/`.
- Local iteration, memory, or private configuration paths are ignored when appropriate.
- Run `agentic-swe verify <project-root>` when the Agentic SWE CLI is available; the source-checkout shell wrapper is transitional.
- No generated document contains private paths, credentials, customer data, or invented facts.
