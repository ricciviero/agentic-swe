# Iteration Queue - <Project Name>

This directory is local and gitignored. It contains developer planning notes and is not part of the public repository.

Every numbered iteration folder contains:

- `task.md` - original client brief, goal, atomic tasks, constraints, and definition of done;
- `plan.md` - technical decisions, ordered steps, affected files, risks, and validation.

## Layout

```text
iterazioni/
  README.md
  01-<name>-due-YYYY-MM-DD/
    task.md
    plan.md
  02-<name>/
    task.md
    plan.md
```

Use `NN-<module-kebab>-due-YYYY-MM-DD/` when a real deadline exists; otherwise use `NN-<module-kebab>/`.

## Active Queue

1. [01-<name>](01-<name>/) - <one-line summary>
2. [02-<name>](02-<name>/) - <one-line summary>

## Lifecycle

Read `task.md` before `plan.md`. Update the plan before code when the approach changes. When closing an iteration, verify every definition-of-done criterion, update durable project documentation when needed, record evidence, and mark the task complete only when all required work is done.
