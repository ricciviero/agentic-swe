---
name: make-plan
description: Create a detailed, phased implementation plan with documentation discovery for Codex. Use when the user asks to plan a feature, task, refactor, migration, or multi-step implementation before coding.
---

# Make Plan

Create an implementation plan that another Codex session, or the current one later, can execute without guessing.

## Codex Constraints

- Do not spawn subagents unless the user explicitly asked for sub-agents, delegation, or parallel agent work.
- When subagents are allowed, use them only for bounded fact gathering or independent verification. Keep final synthesis local.
- Prefer direct repository inspection with `rg`, `sed`, `find`, `git`, and existing docs.
- For OpenAI product/API details, use official OpenAI docs only.

## Workflow

### Phase 0: Documentation Discovery

Always start by finding the authoritative sources before planning implementation:

1. Read project constitution files such as `CLAUDE.md`, `AGENTS.md`, `README.md`, and relevant docs.
2. Search the codebase for existing patterns, names, routes, services, tests, migrations, and commands.
3. Identify actual APIs, method signatures, conventions, and file locations. Do not infer them.
4. Record anti-patterns to avoid, including deprecated helpers, duplicate legacy flows, or files the project says not to touch.

### Plan Shape

Each phase should include:

- What to implement.
- Files or directories likely touched.
- Existing code or docs to follow.
- Verification commands and acceptance checks.
- Anti-pattern guards.
- Any open questions that block implementation.

For feature work, split phases by dependency order, not by technology labels alone. Backend schema changes, API contracts, frontend state, UI, and tests should be sequenced so each phase can be verified.

## Standards

- A plan must be concrete enough to execute. Avoid generic steps like "add service" without naming the service pattern or target location.
- Do not include time estimates unless the user explicitly asks.
- If requirements are missing or contradictory, stop and ask for the smallest clarification needed.
- If the project has a local backlog or iteration system, keep the plan consistent with it.

## Final Response

Return the plan with short phase headings, concrete file references where known, verification commands, and remaining questions. Keep it concise enough to be useful in a later execution turn.
