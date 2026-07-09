# Improvement Playbook

Use this when the task is "improve Aura itself".

## 1. Frame the problem

State the issue as one of:

- wrong default behavior
- missing guard
- bad routing choice
- ambiguous UI state
- too much friction
- not enough visibility
- unnecessary prompt weight

## 2. Find the cheapest correct layer

Choose the fix layer carefully:

- Prompt:
  when behavior is conceptually wrong but the code path is correct
- Routing:
  when the wrong agent, mode, or skill is chosen
- Runtime:
  when jobs, events, or tool loops behave incorrectly
- UI:
  when feedback, visibility, or local state is wrong
- Skill metadata:
  when detection or discoverability is weak

Avoid solving a prompt problem with a large UI rewrite, and avoid solving a UI problem with agent over-instructions.

When a self-improvement skill includes `references/*.md`, prefer reading those references through the skill file access flow before falling back to raw code hotspots.

## 3. Prefer narrow fixes

Examples:

- add a guard before adding a new subsystem
- tighten one prompt rule before rewriting the agent hierarchy
- fix one event contract before adding more client state

## 4. Add feedback where helpful

When Aura improves itself, prefer adding:

- clearer active-skill visibility
- better event logging
- explicit mode or reason fields
- one extra invariant check

## 4.1 Keep the skill in sync

If the change modifies how Aura should reason about, navigate, validate, or improve its own codebase, update the `self-improve` skill as part of the same task.

Typical triggers:

- a new critical file or subsystem becomes part of the normal workflow
- an invariant changes
- the preferred fix layer changes for a recurring class of issues
- validation commands change
- the skill selection or self-improvement flow changes

At minimum, refresh:

- `SKILL.md` for workflow or decision changes
- `references/*.md` for project map or invariant changes

## 5. Validate proportionally

- small UI tweak:
  compile extension
- small backend tweak:
  compile Python sources
- cross-boundary change:
  verify payload shapes and UI handling
- schema change:
  generate an Alembic migration with
  `./scripts/dev-migrate.sh revision "..."`, ALWAYS hand-review the
  generated file (renames are seen as drop+add; type widening/narrowing
  must be checked against existing data), then apply with
  `./scripts/dev-migrate.sh upgrade`. Never hand-edit the DB schema
  directly or add new logic to the deprecated `server/scripts/sync_db.py`.
- dev-env change:
  keep `docker-compose.dev.yml`, the `Dockerfile.dev` files, and
  `scripts/dev-*.sh` consistent; the legacy prod compose files under
  `server/` and `frontend/` must NOT be edited as part of a dev-env tweak.

## 6. Close with useful reporting

Summarize:

- what layer was changed
- why that layer was the right fix
- what was verified
- what residual risk remains
