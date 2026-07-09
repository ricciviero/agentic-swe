## Fix Workflow

Known defects are organized in local numbered folders under [`fix/`](fix/). Each folder contains:

- `bug.md` - symptom, reproduction, expected behavior, impact, and severity;
- `fix.md` - root cause, correction plan, propagation check, regression validation, and final report.

`fix/` is local and gitignored. Keep this queue in severity order.

Use `iterations-planner` to create or update fixes. Investigate the root cause before editing code, correct equivalent occurrences of the faulty pattern, and record verification evidence before marking a fix resolved.
