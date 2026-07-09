# agentic-swe

This file is the canonical instruction set for contributors and coding agents working in this repository.

## Purpose

Maintain a public, reusable, agent-agnostic skill collection. The canonical source of every published skill is `skills/<skill-name>/`.

## Repository rules

- Keep repository documentation, skill instructions, scripts, and metadata in English.
- Preserve the `name` and `description` frontmatter required by Codex skills.
- Keep skill bodies concise and move optional detail into `references/`.
- Do not add credentials, private paths, customer data, or unlicensed material.
- Preserve licenses and notices for third-party skills, assets, fonts, and code.
- Do not edit an installed `.codex/skills` or `.claude/skills` copy as the source of truth; edit this repository and use links or adapters.

## Agent compatibility

- Treat `AGENTS.md` as the canonical project instruction file.
- Support Codex and Claude Code through the same canonical skill directory whenever their discovery behavior allows it.
- Add an agent-specific adapter only when it is necessary for discovery or configuration. Keep adapters generated or minimal, never a divergent second copy of a skill.

## Skill changes

- Use `skill-creator` whenever creating or materially revising a skill.
- Validate every changed Codex skill with `quick_validate.py` from the Codex `skill-creator` installation.
- Update `agents/openai.yaml` when a Codex skill's user-facing metadata no longer matches its `SKILL.md`.
- For a multi-skill change, a workflow change, or a release with several deliverables, use `iterations-planner` before editing.

## Scope discipline

- Keep one skill focused on one durable capability.
- Propose a project-specific skill only for repeated, project-specific knowledge not already covered by a global skill.
- Keep root documentation accurate when installation, compatibility, licensing, or the public skill inventory changes.
