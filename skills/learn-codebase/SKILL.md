---
name: learn-codebase
description: Prime Codex on a codebase by systematically reading source, docs, configuration, tests, and architecture notes. Use when the user asks to learn, read, prime, or get up to speed on a repo.
---

# Learn Codebase

Build a working mental model of the repository before making architectural or multi-file changes.

## Scope

Read broadly and systematically:

- Root instructions: `CLAUDE.md`, `AGENTS.md`, `README.md`, `.gitignore`, package/build files.
- Application source by module.
- Tests, migrations, scripts, Docker/config files.
- Local memory or decision logs when present.

For large repositories, prioritize files that define boundaries and conventions first, then drill into the domain relevant to the user's task.

## Codex Workflow

- Use `rg --files`, `find`, `sed`, `wc`, and `git` commands.
- Read files in chunks when large.
- Do not claim full understanding until the relevant files have actually been opened.
- Keep notes concise: architecture, entry points, data flow, test strategy, key commands, and known risks.
- Do not modify files unless the user also asked for implementation.

## Output

Summarize:

- Modules and responsibilities.
- Main runtime/build/test commands.
- Critical conventions and project-specific rules.
- Key files to touch for likely future work.
- Gaps or files not read due to size or irrelevance.
