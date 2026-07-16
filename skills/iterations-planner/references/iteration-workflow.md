# Iteration Workflow

Use this reference for planning, updating, or closing an iteration or fix. The workflow is agent-agnostic and is the detailed procedure behind the Agentic SWE planning gate.

## Local Workspace

Read `.agentic/config.yaml` first when it exists. Use the configured directories; otherwise use these defaults:

```text
iterazioni/   Planned feature work
fix/          Existing behavior that is broken
```

Add both directories to `.gitignore` before creating records. They are working notes, not a substitute for product requirements or versioned engineering documentation.

## Naming and Ordering

Use contiguous numeric prefixes:

```text
iterazioni/
  01-auth-flow-due-2026-08-15/
  02-report-export/
fix/
  01-login-redirect-loop/
```

Use the `-due-YYYY-MM-DD` suffix only for an actual deadline. Keep severity inside `bug.md`, not in the fix folder name. Renumber subsequent folders if an item is inserted in the middle of the work queue.

## Plan Features

1. Read the full brief and inspect current project state.
2. Split only genuinely independent deliverables into separate iterations.
3. Copy the original brief into `task.md` verbatim.
4. Define the goal, atomic tasks, dependencies, constraints, and verifiable definition of done.
5. Write `plan.md` before code: decisions, affected files, ordered steps, validation, and risks.
6. Update the local `iterazioni/README.md` index.
7. Add or update an `AGENTS.md` iteration section only when the project uses it and the list is useful to collaborators.

An iteration is ready to implement only when its task and plan agree. If scope changes, update `task.md` first and then `plan.md`; do not let code become the only current description of the work.

The reference runtime recognizes structural planning evidence only when the host supplies a record directory contained by the configured iteration or fix workspace and both required files are non-empty. This containment and presence check is intentionally narrower than a qualitative review: keep the original brief, decisions, affected files, validation, and completion evidence current even though the runtime does not grade their prose.

## Plan Fixes

1. Record the symptom, reproduction, expected behavior, impact, and severity in `bug.md`.
2. Investigate before writing the repair plan. State the root cause, not merely the symptom.
3. Plan the correction, all affected occurrences of the faulty pattern, regression coverage, and adjacent-flow verification in `fix.md`.
4. Update the local `fix/README.md` index in severity order.

Correct the root cause and search for the same pattern elsewhere in the relevant module. A bug fix is incomplete when it merely hides the symptom or leaves equivalent faulty call sites behind.

## Feature Flags

Use `feature-flags` for a new, reversible product capability only when the project explicitly uses that mechanism. Do not hide a broken existing behavior behind a feature flag; plan it as a fix instead.

When a planned iteration depends on a flag, record the flag name, default state, owner, activation condition, and rollback condition in `task.md` and `plan.md`.

## `AGENTS.md` Integration

`AGENTS.md` remains the sole canonical instruction file. Its `Agentic Workflow` section defines the planning gate; add an active queue only when it is useful to collaborators:

```markdown
## Agentic Workflow

Read `.agentic/config.yaml` before selecting skills or creating local workflow records. For non-trivial work, use `iterations-planner` before editing. Local plans and fixes use the configured directories and remain gitignored unless this repository explicitly says otherwise.

### Active Queue

1. `iterazioni/01-example/` - <one-line summary>
2. `fix/01-example/` - <severity> - <one-line summary>
```

Do not put full task or plan content in `AGENTS.md`. Point to the local workspace and keep the index concise.

## Work Lifecycle

### Start

1. Read `task.md` then `plan.md`, or `bug.md` then `fix.md`.
2. Mark the item in progress with its date.
3. Update the plan before changing code when a better approach or new constraint is discovered.

### Close an iteration

1. Implement the agreed plan.
2. Update durable architecture or convention documentation when it changed.
3. Verify the definition of done, relevant automated checks, and a real user-facing path where applicable.
4. Record evidence in the final report.
5. Mark the item complete only when every required criterion is met; otherwise state what remains.

### Close a fix

1. Correct the root cause.
2. Search and address equivalent occurrences.
3. Demonstrate the regression before and after the change when feasible.
4. Check adjacent paths for side effects.
5. Record evidence and mark the fix resolved only when the stated conditions hold.

## Validation Checklist

- Local workspace is ignored by Git.
- Numbered folder names are contiguous and indexes match them.
- Each iteration has `task.md` and `plan.md`.
- Each fix has `bug.md` and `fix.md`.
- Original brief or reported symptom is preserved without reinterpretation.
- Plans identify files, order, decisions, and validation.
- Any `AGENTS.md` update points to the local workspace and does not duplicate it.
- Local workspace names match `.agentic/config.yaml` when that manifest exists.
- `agentic-swe verify <project-root>` passes when the CLI is available and the project contract changed.
