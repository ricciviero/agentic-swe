---
name: angular-developer
description: Senior-level Angular frontend development with standalone components and signals. Use this skill whenever the user asks to create, modify, or review Angular code, components, services, routing, data fetching, TypeScript types, Tailwind styling, or frontend architecture. Trigger on any mention of Angular, standalone component, signals, Angular routing, HttpClient, guards, interceptors, or TypeScript frontend in Angular context. Also trigger when the user mentions route, service, component, guard, pipe, or state management in an Angular context. When in doubt, use this skill for any Angular frontend task.
---

# Angular Frontend Agent

Use this skill for Angular frontend work with standalone components, signals, routing, services, forms, HttpClient, guards, interceptors, Tailwind, accessibility, or tests.

## Load References

Inspect the existing Angular workspace and the official documentation matching its installed version before relying on version-specific APIs, CLI behavior, or migration details.

Use the focused Angular references when the task is narrower:

- Components, inputs, outputs, host elements, styling: read the matching files in `references/`.
- Signals, effects, linked signals, resources: read `signals-overview.md`, `effects.md`, `linked-signal.md`, or `resource.md`.
- Routing, guards, resolvers, navigation, outlets, loading strategies: read the relevant router reference.
- Forms: read `reactive-forms.md`, `signal-forms.md`, or `template-driven-forms.md`.
- Tests: read `testing-fundamentals.md`, `component-harnesses.md`, `router-testing.md`, or `e2e-testing.md`.
- Tailwind or ARIA: read `tailwind-css.md` or `angular-aria.md`.

## Core Workflow

Develop one feature at a time and keep the order explicit:

```text
Route -> config/provider -> service -> component -> guard/resolver if needed -> tests
```

Before editing, inspect the existing Angular version, app layout, package manager, test setup, and styling conventions. Prefer the project's established structure over inventing a new one.

## Non-Negotiables

- Use standalone components and modern Angular patterns by default unless the project clearly uses modules.
- Prefer signals and typed APIs for new state; do not introduce broad global state without a clear need.
- Keep component templates declarative and move data access/business rules into services.
- Type request/response models explicitly before wiring services or components.
- Use functional guards/interceptors when the project supports them.
- Preserve accessibility: labels, ARIA only when needed, keyboard behavior, focus states, and semantic controls.
- Run the smallest meaningful validation after important edits: usually `ng build`, targeted unit tests, or E2E tests based on scope.

## Delivery Checklist

- Files follow existing naming and folder conventions.
- Components compile with strict TypeScript.
- API/services have typed boundaries and no duplicated request logic in components.
- Forms validate at the right layer and show useful errors.
- Routing changes include loading/error/guard behavior where relevant.
- User-facing behavior is covered by tests when the risk warrants it.
