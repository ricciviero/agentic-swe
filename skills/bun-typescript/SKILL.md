---
name: bun-typescript
description: 'Use when building CLIs, tools, terminal apps, or servers with Bun + TypeScript: Bun runtime APIs (Bun.spawn/spawnSync, Bun.$ shell, Bun.file/Bun.write/FileSink, Bun.serve), bun build, bun build --compile for standalone single-file executables (cross-compile, --minify, --sourcemap, --bytecode), bun test (Jest-style matchers, mocks, lifecycle, coverage), package.json bin entries and shebangs for CLIs, recommended Bun tsconfig, bun install/workspaces, performance, and Bun-vs-Node gotchas. Trigger on: Bun, bun build, bun test, bun install, Bun.spawn, Bun.$, Bun.file, Bun.serve, single-file executable, standalone binary, TypeScript CLI with Bun, bun shebang, bunfig.toml, @types/bun.'
---

# Bun TypeScript

Use this skill to build CLIs, terminal tools, scripts, servers, tests, and standalone binaries with Bun and TypeScript.

## Load References

Inspect the installed Bun version and official documentation before relying on version-specific runtime, bundler, or testing behavior.

## Core Defaults

- Use Bun to run TypeScript directly; avoid `ts-node` unless the project requires it.
- Use `#!/usr/bin/env bun` for CLI entrypoints.
- Add `@types/bun` for Bun globals.
- Prefer `bun test` for tests in Bun-first projects.
- Use `bun build --compile` when the deliverable is a standalone binary.

## Common APIs

- Shell/processes: `Bun.$`, `Bun.spawn`, `Bun.spawnSync`.
- Files: `Bun.file`, `Bun.write`, `FileSink` for streaming writes.
- Servers: `Bun.serve` for lightweight HTTP/WebSocket needs.
- Package management/workspaces: `bun install`, workspaces, and `bun.lock` conventions.

## Non-Negotiables

- Check existing `package.json`, `bunfig.toml`, `tsconfig.json`, and lockfiles before changing tooling.
- Keep CLI args, exit codes, stdout/stderr, and errors predictable.
- Avoid Node-only APIs when Bun-native APIs are simpler and stable.
- Do not compile secrets or environment-specific values into binaries.
- Validate with `bun test`, `bun run`, `bun build`, or `bunx tsc --noEmit` based on scope.

## Delivery Checklist

- CLI entrypoint has a shebang and executable/installable path if needed.
- `package.json` scripts match the project workflow.
- TypeScript config supports Bun types.
- Tests cover parser/core logic for non-trivial tools.
- Standalone binaries are built with the intended target/options.
