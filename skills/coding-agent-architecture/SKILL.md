---
name: coding-agent-architecture
description: 'Use when designing or building a coding agent like opencode, Claude Code, or aider: tool-calling agent loops, tool design (read/write/edit/bash/glob/grep), action permissions and safety, Plan/Build modes, subagents, sessions, undo, context engineering, streaming, and abort handling. Focused on TypeScript + Bun + Vercel AI SDK. Trigger on: coding agent, agent loop, tool design, opencode, Plan/Build mode, permission system, edit tool, agent session, compaction, subagent, undo snapshot.'
---

# Coding Agent Architecture

Use this skill when designing or building a terminal coding agent like opencode, Claude Code, or aider: tool-calling loop, file/shell tools, permissions, Plan/Build modes, subagents, sessions, undo, context management, streaming, and abort behavior.

## Load References

Inspect the target runtime, model SDK, and project conventions before implementing provider-specific code or persistent session behavior.

## Core Model

A coding agent is a loop around three primitives:

1. **Agent loop**: system/context/history/tools -> model -> text/tool calls -> tool results -> repeat.
2. **Tools**: typed capabilities such as read, write, edit, bash, glob, grep, and patch.
3. **Permissions**: deterministic policy code decides what is allowed; the model only proposes.

## Build Order

1. Single-agent loop with bounded steps.
2. Minimal tools: read, edit/write, grep/glob, shell.
3. Permission gates for filesystem and shell mutations.
4. Session persistence and event log.
5. Streaming UI and abort handling.
6. Context compaction and project instruction loading.
7. Plan/Build modes, undo, and subagents after the basics work end-to-end.

## Non-Negotiables

- Do not build plugin/tool abstraction layers before the core loop and tools work.
- Keep model-generated intent separate from execution policy.
- Treat shell and file mutation as privileged actions.
- Persist enough events to reconstruct sessions and debug failures.
- Make aborts and denied permissions first-class states.
- Keep context construction explicit and inspectable.

## Delivery Checklist

- Tool schemas are typed and validated.
- Tool results are summarized without hiding actionable errors.
- Permission decisions are deterministic and auditable.
- Sessions can resume or at least fail with clear state.
- The UI streams useful intermediate output without corrupting history.
