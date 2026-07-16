# agentic-swe

This file is the canonical instruction set for contributors and coding agents working in this repository.

## Purpose

Maintain a public, reusable, agent-agnostic behavior framework for software-engineering agents. The normative behavior contract lives in `protocol/v1/`; the canonical source of every published skill remains `skills/<skill-name>/`.

## Repository rules

- Keep repository documentation, skill instructions, scripts, and metadata in English.
- Preserve the `name` and `description` frontmatter required by Codex skills.
- Keep skill bodies concise and move optional detail into `references/`.
- Do not add credentials, private paths, customer data, or unlicensed material.
- Preserve licenses and notices for third-party skills, assets, fonts, and code.
- Do not edit an installed `.codex/skills` or `.claude/skills` copy as the source of truth; edit this repository and use links or adapters.
- Keep model/provider APIs, concrete tool implementations, host permissions, persistence, and UI concerns outside the protocol contract.

## Protocol changes

- Treat `protocol/v1/protocol.yaml` as the canonical behavior definition and `protocol/v1/README.md` as its normative explanation.
- Keep serialized contracts under `protocol/v1/schemas/` and normative examples under `protocol/v1/conformance/`.
- A behavior change must update the protocol definition, affected schema, at least one conformance case, the specification, and any compatibility adapter whose visible semantics changed.
- Keep `protocolVersion`, project config `version`, and future package semver independent and document their compatibility.
- The protocol may request abstract capabilities; it must never grant permissions or encode a provider, concrete tool registry, or agent UI.
- Regenerate embedded runtime assets with `npm run protocol:generate`; `npm run protocol:check` must reject drift from `protocol/v1/`.

## Runtime changes

- Keep `@agentic-swe/core` deterministic and free of filesystem, network, shell, provider, Node, and Bun runtime dependencies.
- Keep repository discovery, YAML parsing, path containment, skill inventory, and planning-evidence inspection in `@agentic-swe/node`; its inspect/evaluate paths must remain read-only.
- A model-facing classifier or skill router is an untrusted port. Validate its output before evaluation and never derive effective permissions from model output.
- Export supported APIs from each package root. Do not require consumers to deep-import internal files.
- Run `npm run typecheck`, `npm test`, and `npm run pack:check` after runtime or packaging changes.

## Agent compatibility

- Treat `AGENTS.md` as the canonical project instruction file.
- Support Codex and Claude Code through the same canonical skill directory whenever their discovery behavior allows it.
- Add an agent-specific adapter only when it is necessary for discovery or configuration. Keep adapters generated or minimal, never a divergent second copy of a skill.

## Agentic Workflow

- Read `.agentic/config.yaml` before selecting skills or creating local workflow records.
- For non-trivial work, use `iterations-planner` before editing. Local records live in `iterazioni/` or `fix/` and remain gitignored.
- Treat the selected-skill mapping in `.agentic/config.yaml` as the repository-approved global-skill mapping.
- Run `scripts/verify-agentic-project.sh` after changing the project contract or behavior-layer tooling.

## Skill changes

- Use `skill-creator` whenever creating or materially revising a skill.
- Validate every changed Codex skill with `quick_validate.py` from the Codex `skill-creator` installation.
- Update `agents/openai.yaml` when a Codex skill's user-facing metadata no longer matches its `SKILL.md`.
- For a multi-skill change, a workflow change, or a release with several deliverables, use `iterations-planner` before editing.

## Scope discipline

- Keep one skill focused on one durable capability.
- Propose a project-specific skill only for repeated, project-specific knowledge not already covered by a global skill.
- Keep root documentation accurate when installation, compatibility, licensing, or the public skill inventory changes.
- Keep `protocol/v1/`, `core/agentic-protocol.md`, its templates, the bootstrap skill, and the planning skill aligned. Do not make an adapter a second behavioral source of truth.
- Global installers must preserve unowned user configuration and expose a dry-run mode.
