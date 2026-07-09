# Invariants

These are the first things to preserve when editing Aura itself.

## Client/server contract

- If a payload shape changes, update both server and extension.
- If a job event shape changes, update both producer and consumer.
- Do not assume the UI and backend can evolve independently on shared fields.

## Job lifecycle

- A job should end in one clear state:
  `completed`, `failed`, or `cancelled`
- The UI should not stay in loading after a terminal event.
- `send` and `stop` must remain mutually exclusive states in the composer.

## Skill system

- Catalog metadata may exist without full body loading.
- Full `SKILL.md` content should be loaded lazily.
- Manual selection must remain higher priority than auto-detection.
- Auto-detection must be explainable and easy to override.

## Prompt/runtime

- If the user asked for implementation, do not silently degrade into plan-only output unless a real blocker exists.
- Tool behavior should stay explicit and deterministic.
- Prompt changes must be checked against small tasks and large tasks separately.

## UX

- Avoid duplicate status surfaces for the same runtime state.
- Active skill feedback must stay visible.
- Loading, retry, and error states should not overlap ambiguously.

## Terminal execution

- Terminal commands run through the VS Code extension host, not the
  backend. Do not move execution server-side without an explicit
  cross-layer redesign.
- `global` scope commands are approval-gated even when the chat is in
  `auto` mode. Do not let `auto` bypass global-scope approval.
- Foreground commands must use bounded timeouts; long-running work belongs
  in background sessions with explicit stop support.
- Terminal cards are UI-only state: switching chats or starting a new chat
  must terminate still-running sessions before clearing the local
  session registry, otherwise orphan sessions leak.
- A user-initiated Stop from the chat card must propagate
  `stopped_by_user=true` to the UI and deliver `status: 'stopped'` to the
  agent tool result, so the agent can reason about the abort instead of
  retrying blindly.

## Context compaction

- Two-track strategy is load-bearing: OpenAI native compaction only on the
  Responses API path; everything else (Anthropic, Gemini, OpenRouter, ...)
  uses Aura-native summary rewrite. Do not collapse the two paths into one
  until a non-OpenAI provider has a validated native compaction primitive.
- If native compaction session construction fails, fall back to the
  Aura-native path instead of aborting the agent run.
- Manual compaction in chat UI must go through the explicit
  `POST /api/history/{history_id}/compact` endpoint. Never fake it by
  injecting a natural-language prompt to the agent.
- The `compacted` flag in session metrics must reflect the current session
  state and must not stick to `true` permanently after a single compaction
  event — the UI badge relies on it.
- Compaction must not regress interrupted runs, approvals, or skill state;
  preserve the most recent N items from the session tail.

## Document agents (PDF / DOCX)

- The WS `read_file` call must remain fully backward compatible: the
  `binary: true` flag is opt-in and, when absent, behavior is unchanged.
- Binary reads return `content_base64` with a `size` field; never try to
  stuff binary data into the existing text `content` field.
- `convert_document` must never silently fail. If pandoc is missing, return
  `pandoc_not_installed` with an install hint. PDF output is always rejected.
- Scanned PDFs without a text layer must be surfaced to the user
  (`empty_text_layer: true`), not masked with fabricated content.
