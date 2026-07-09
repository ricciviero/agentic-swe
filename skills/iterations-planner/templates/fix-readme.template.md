# Fix Queue - <Project Name>

This directory is local and gitignored. It contains developer working notes and is not part of the public repository.

Each numbered folder contains:

- `bug.md` - the reported problem, reproduction, expected behavior, impact, and severity;
- `fix.md` - root-cause diagnosis, correction steps, propagation check, regression validation, and final report.

## Layout

```text
fix/
  README.md
  01-<problem-name>/
    bug.md
    fix.md
```

Use `NN-<problem-kebab>/` folder names. Store severity in `bug.md`, then order the index by severity and arrival.

## Active Queue

1. [01-<name>](01-<name>/) - <severity> - <one-line summary>

## Lifecycle

Start by reading `bug.md`, then confirm or investigate the root cause before writing `fix.md`. When closing a fix, correct the root cause, search for equivalent occurrences, run regression coverage, verify adjacent paths, complete the final report, and mark the record resolved.

Use a feature flag for a new reversible capability only. Do not hide a defect behind a feature flag.
