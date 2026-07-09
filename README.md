# agentic-swe

A public, agent-agnostic collection of software-engineering skills for coding agents.

The repository keeps one canonical skill source under `skills/`. It is designed to work with OpenAI Codex and Claude Code today, while keeping project governance in the portable `AGENTS.md` format.

## Principles

- Keep `AGENTS.md` as the canonical repository instruction file.
- Keep each skill in one source directory; do not maintain hand-edited agent-specific copies.
- Use lightweight adapters or symlinks only where an agent needs a particular discovery path.
- Use `agents-setup` to bootstrap a project and map only the skills relevant to it.
- Use `iterations-planner` for non-trivial work that benefits from explicit scope, sequencing, and acceptance criteria.

## Included skills

The bundle currently contains 42 skills across frontend and mobile development, backend and cloud engineering, agent workflows, delivery automation, and design engineering. Browse [`skills/`](skills/) for the full collection.

Notable workflow skills:

- `agents-setup`: creates or updates an agent-neutral project setup around `AGENTS.md`, discovers available global skills, and proposes project-specific skills where reusable project knowledge is missing.
- `iterations-planner`: organizes non-trivial work in local, gitignored iteration folders with a task brief and an implementation plan.
- `skill-creator`: not bundled here because it is provided by Codex; use it when creating or revising a Codex skill.

## Install

Clone the repository in a stable location, then create links for each agent you use:

```bash
git clone https://github.com/ricciviero/agentic-swe.git
cd agentic-swe
bash scripts/link-skills.sh codex
bash scripts/link-skills.sh claude
```

The installer links each `skills/<skill>` directory into the agent's global skills directory:

- Codex: `${CODEX_HOME:-~/.codex}/skills`
- Claude Code: `${CLAUDE_HOME:-~/.claude}/skills`

It never overwrites an existing skill. Resolve any reported conflict deliberately, then run the command again. After pulling updates, the linked skills are already current.

## Project setup

From a target repository, ask a coding agent to use `agents-setup`. The resulting `AGENTS.md` is the source of truth for project rules, global-skill mapping, project skills, and the iteration workflow.

Project-specific skills live canonically in `.agents/skills/`. Codex and Claude Code adapters are created only when the selected agent needs a dedicated discovery path.

## Repository layout

```text
skills/                 Canonical, reusable skill directories
scripts/link-skills.sh  Non-destructive Codex and Claude Code linker
AGENTS.md               Contribution rules for this repository
THIRD_PARTY_NOTICES.md  Licenses that apply to bundled third-party material
```

## Contributing

Keep all new repository content in English. Do not commit credentials, private machine paths, customer information, or material that cannot be published under a compatible license. Validate changed Codex skills with the `skill-creator` validator before opening a change.

## License

This repository is licensed under the Apache License 2.0. Some bundled assets remain under their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
