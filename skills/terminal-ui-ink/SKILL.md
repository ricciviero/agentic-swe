---
name: terminal-ui-ink
description: 'Use when building TUIs or terminal interfaces in TypeScript + Bun. Covers Ink (React for terminals: render/Box/Text/useInput/useApp/useStdout/useFocus/measureElement), long-output streaming with Static (immutable logs plus a dynamic area), spinners during LLM calls, text input, selects/lists, focus management, and alternatives (@clack/prompts for sequential prompts, blessed/neo-blessed, raw readline/ANSI) with guidance on when to choose each option. Trigger on: Ink, ink-text-input, ink-spinner, @inkjs/ui, TUI, terminal UI, interactive terminal, useInput, useApp, useStdout, Static, terminal render(), CLI spinner, CLI select, terminal chat, REPL, terminal agent loop, clack, blessed, readline, ANSI escape, terminal token streaming.'
---

# Terminal UI Ink

Use this skill to build rich terminal UIs in TypeScript/Bun with Ink, React, streaming output, spinners, text input, select menus, focus handling, and fallbacks for non-TTY environments.

## Load References

Inspect the installed Ink and Bun versions before relying on package-specific component APIs, peer dependencies, or streaming behavior.

## Choose the Right Tool

- Use Ink for persistent interactive UIs, chat loops, streaming panes, focus, and React-style composition.
- Use `@clack/prompts` for short sequential prompts.
- Consider blessed/neo-blessed for dense fullscreen dashboards.
- Use raw readline/ANSI only for tiny or dependency-free flows.

## Core Rules

- Verify package versions and React peer requirements before installing.
- Keep one React copy in the tree.
- Use `<Static>` for immutable long logs and a separate dynamic area for current streaming state.
- Support non-TTY output for CI, pipes, and logs.
- Handle Ctrl+C/abort cleanly with `useApp`, `useInput`, or process signals.
- Avoid rerendering huge logs every token; append immutable chunks instead.
- Keep terminal width, wrapping, and keyboard navigation in mind.

## Implementation Checklist

- Existing package manager and runtime are respected.
- `tsconfig` supports JSX for React/Ink.
- Components have clear ownership of input, focus, and submit/cancel behavior.
- Streaming does not flicker or lose prior output.
- Non-interactive fallback is usable.
- Errors render clearly and the process exits with the right code.
