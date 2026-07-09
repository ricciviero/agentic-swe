---
name: nextjs-frontend
description: Senior-level Next.js frontend development with App Router and React. Use this skill whenever the user asks to create, modify, or review Next.js code, React components, routing, data fetching, TypeScript types, Tailwind styling, or frontend architecture. Trigger on any mention of Next.js, App Router, Server Components, Client Components, React hooks, Tailwind CSS, or TypeScript frontend. Also trigger when the user mentions route segments, layouts, services, stores, or hooks in a Next.js context. When in doubt, use this skill for any Next.js or React frontend task.
---

# Next.js Frontend Agent

Use this skill for Next.js App Router, React, Server Components, Client Components, routing, layouts, data fetching, TypeScript, Tailwind, hooks, stores, and frontend architecture.

## Load References

Inspect the installed Next.js version, existing App Router conventions, and test setup before relying on version-specific behavior.

Read [references/nextjs-config.md](references/nextjs-config.md) when changing `next.config.*`, image config, experimental flags, redirects, rewrites, env handling, or build/runtime configuration.

## Core Workflow

Develop one feature at a time:

```text
Route segment -> layout -> server component -> client component -> tests
```

Inspect the existing app structure before creating folders. Prefer the App Router and Server Components unless the project clearly uses another pattern.

## Rendering Rules

- Keep components server-side by default.
- Add `'use client'` only for state, effects, browser APIs, event handlers, context providers, or client-only libraries.
- Fetch server data in Server Components or route handlers when possible.
- Keep client components small and focused around interactivity.
- Do not leak secrets into client code or `NEXT_PUBLIC_*` by accident.

## Data and State

- Define types before services and UI wiring.
- Centralize API clients and auth headers.
- Use URL/search params for shareable state where appropriate.
- Use local state for local interaction, stores only for genuinely shared client state.

## Delivery Checklist

- Loading, error, empty, and not-found states are considered where relevant.
- Components are typed and follow existing folder/naming conventions.
- Accessibility and responsive behavior are preserved.
- Validation uses the project's build, lint, typecheck, and E2E/unit test commands as appropriate.
