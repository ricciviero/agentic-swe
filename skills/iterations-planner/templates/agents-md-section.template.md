## Iteration Workflow

Future feature work is organized in local iteration folders under [`iterazioni/`](iterazioni/). Each numbered folder contains:

- `task.md` - original brief, goal, tasks, and definition of done;
- `plan.md` - decisions, ordered implementation steps, affected files, risks, and validation.

`iterazioni/` is local and gitignored. It is normal for the folder to be absent from another clone.

### Active Queue

1. `01-<name>/` - <one-line summary>
2. `02-<name>/` - <one-line summary>

Use `iterations-planner` to create or update the queue. Read `task.md` before `plan.md`, update the plan before code when the approach changes, and record completion evidence before marking an iteration done.
