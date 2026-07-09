---
name: improve-aura
description: Use this skill whenever the user asks Aura to modify Aura itself, improve its behavior, refine its UX, change prompts, adjust skills, update the VS Code extension, or improve server-side agent orchestration. Trigger on requests about Aura runtime, agent behavior, prompts, chat UX, skills catalog, auto skill detection, WebSocket flow, job execution, self-improvement, or when the repository being edited is Aura itself. Use this skill also when the goal is to audit Aura's weaknesses and then implement focused improvements safely.
---

# Self-Improve Aura

Use this skill when modifying Aura itself: agent behavior, prompts, chat UX, skill catalog, VS Code extension, WebSocket flow, server orchestration, jobs, approvals, context compaction, document tools, or self-improvement workflows.

## Load References

Read the focused reference before touching code:

- Architecture and WebSocket flow: `references/architecture.md`.
- Backend map and worker/runtime behavior: `references/backend-map.md`.
- Frontend/VS Code UI map: `references/frontend-map.md`.
- Invariants and contracts: `references/invariants.md`.
- Improvement workflow: `references/improvement-playbook.md`.

## Choose Mode

- `implement`: user wants code changes now. Default.
- `audit`: user wants diagnosis, risks, or a plan.
- `self-improvement`: user wants Aura behavior/prompt/UX/skill improvements.

## Core Workflow

1. Classify the request and load the relevant reference map.
2. Inspect the smallest code surface that owns the behavior.
3. Preserve client/server contracts and payload shapes unless intentionally migrating them.
4. Patch focused files only; avoid broad unrelated refactors.
5. Align generated/built extension output when the repo requires it.
6. Validate with targeted backend/frontend tests, typecheck, build, or manual smoke checks based on touched code.

## Hard Boundaries

- Do not break chat history, job lifecycle, tool execution, approval gating, or WebSocket event compatibility.
- Do not change prompts/agent routing without checking how skills are detected and injected.
- Do not update source TypeScript without considering compiled `out/` files if the extension runtime uses them.
- Do not treat Aura as a generic app; use the reference maps to find ownership.

## Delivery Checklist

- User-facing behavior is described clearly.
- Any contract changes are explicit and justified.
- Tests/builds run or skipped reasons are reported.
- Skill changes preserve Codex/Claude format compatibility where relevant.
