---
name: iterations-planner
description: Execute the Agentic SWE planning gate for non-trivial feature work and bug fixes. Organize local, gitignored iteration folders with task.md and plan.md, or fix folders with bug.md and fix.md; preserve the original brief, define acceptance criteria, and keep plans concrete. Use for multi-deliverable briefs, backlog planning, iteration planning, /iterations, /fix, regressions, bug-fix planning, or when the global protocol or agents-setup classifies work as non-trivial.
---

# iterations-planner

Turn a non-trivial brief into local, structured work folders without polluting the tracked repository. The global Agentic SWE protocol decides when this workflow is required; this skill owns the records, templates, and validation.

## Load Resources

Read [references/iteration-workflow.md](references/iteration-workflow.md) for naming, lifecycle, `AGENTS.md` integration, feature-flag handling, and closure rules. Use the files in `templates/` when creating concrete artifacts.

## Activation

Use this skill for:

- two or more distinct deliverables in one brief;
- behavior changes spanning layers, migrations, refactors, or a client brief with unclear sequencing;
- explicit iteration or backlog planning requests;
- bug and regression planning, including `/fix`.
- a non-trivial classification from the Agentic SWE protocol or `.agentic/config.yaml`.

Do not add this overhead for a clearly mechanical microtask.

## Core Rules

- Read `.agentic/config.yaml` when present. Use its iteration and fix directories rather than assuming default names.
- `iterazioni/` and `fix/` are the default local developer workspaces and must be gitignored unless the repository explicitly chooses otherwise.
- Every iteration has a numbered folder containing `task.md` and `plan.md`.
- Every fix has a numbered folder containing `bug.md` and `fix.md`.
- Preserve the original client brief verbatim in task and bug records.
- Do not add time estimates, t-shirt sizes, or deadline-feasibility judgments.
- Keep numbering contiguous when adding, removing, or reordering entries.
- Keep plans concrete: affected files, implementation order, decisions, risks, and validation.
- Update `AGENTS.md` only when the iteration workflow or durable project rules change; never make `CLAUDE.md` the canonical target.

## Workflow

1. Inspect `.agentic/config.yaml`, existing local workspaces, `AGENTS.md`, and `.gitignore`.
2. Separate independent features from defects.
3. Ensure the chosen local folders are ignored.
4. Create or update numbered folders using the supplied templates.
5. Update local indexes and the relevant `AGENTS.md` section when it exists.
6. Before implementation, keep the task or fix record and plan aligned with any scope change.
7. Verify folder contents, numbering, ignore behavior, and alignment with the Agentic Workflow section before reporting the result.

## Validation

Run `git check-ignore` for local folders, verify required files in every numbered folder, and ensure generated records do not contradict the original brief. Run `scripts/verify-agentic-project.sh` when the Agentic SWE package is available and the project contract changed. Report unresolved assumptions rather than inventing them.
