---
name: feature-flags
description: Self-hosted kill-switch module for enabling or disabling backend, frontend, or full-stack application features through a developer-only admin UI. Stack-agnostic across NestJS, Spring Boot, .NET, FastAPI, Rust/Axum, Next.js, Angular, and React Native. Use for `/feature-flags`, feature flags, kill switches, developer switches, wrapping new work behind flags, new project setup, or iteration planning. This is not LaunchDarkly/Unleash, A/B testing, percentage rollout, audit logging, or multi-environment database management.
---

# Feature Flags

Design and implement a stack-agnostic, self-hosted feature flag system for a single project developer. The developer uses an admin UI to enable or disable features for all users immediately, with realtime hot reload.

Write code, comments, and explanations in clear technical English unless the host project explicitly uses another language.

## Scope

This module is:

- A `feature_flags` table or document collection in the app database.
- A public read endpoint that returns only enabled flags.
- Developer-protected admin endpoints for creating, updating, and deleting flags.
- A realtime channel, such as WebSocket, SSE, or SignalR, for instant updates.
- A sectioned admin UI with on/off switches.
- Backend and frontend helpers such as `isEnabled('key')`, `useFeatureFlag('key')`, and `<Feature flag="...">`.
- A triple-check developer auth pattern: environment identity, database role, and middleware.

This module is not a third-party flag service, A/B testing, percentage rollout, user targeting, audit log, multi-tenant flag system, or generic RBAC system.

## Reference Routing

Read only the references needed for the task:

| Need | Reference |
|---|---|
| DB schema and migrations | [references/data-model.md](references/data-model.md) |
| REST endpoints and realtime protocol | [references/api-contract.md](references/api-contract.md) |
| Admin UI design and behavior | [references/ui-admin-panel.md](references/ui-admin-panel.md) |
| Developer identification and middleware | [references/developer-auth.md](references/developer-auth.md) |
| Stack-specific backend patterns | [references/backend-patterns.md](references/backend-patterns.md) |
| Stack-specific frontend patterns | [references/frontend-patterns.md](references/frontend-patterns.md) |
| Integration with project workflows | [references/integrations.md](references/integrations.md) |

For a new end-to-end setup, read the references in that order.

## Defaults

| Area | Default |
|---|---|
| Implementation language | Host project language |
| Storage | SQL table `feature_flags`; MongoDB collection only for document-based apps |
| Flag naming | `kebab-case` with scope prefix: `be:`, `fe:`, `fs:` |
| Realtime | Native stack channel; Socket.io for Node, native WebSocket for Spring/Axum, SSE for FastAPI/.NET when simpler |
| Fallback | Client polling every 5 seconds if realtime fails |
| Backend cache | In-memory `Map<key, enabled>` invalidated before broadcast |
| Admin security | `DEVELOPER_EMAIL` + `users.is_developer = true` + `requireDeveloper` middleware |
| Public endpoint | `GET /api/feature-flags` returns only enabled flags with `key` and `scope` |
| Admin endpoints | `GET/POST/PATCH/DELETE /api/admin/feature-flags` |
| New flag default | `enabled = false` |

## Canonical Table

```sql
CREATE TABLE feature_flags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           VARCHAR(120) NOT NULL UNIQUE,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  section       VARCHAR(100) NOT NULL DEFAULT 'General',
  scope         VARCHAR(20)  NOT NULL CHECK (scope IN ('backend','frontend','fullstack')),
  enabled       BOOLEAN      NOT NULL DEFAULT FALSE,
  iteration_id  VARCHAR(120),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_section ON feature_flags(section);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
```

## Canonical API

```text
GET /api/feature-flags
  -> 200 OK
     [ { "key": "fs:checkout-v2", "scope": "fullstack" } ]

GET /api/admin/feature-flags
POST /api/admin/feature-flags
PATCH /api/admin/feature-flags/:key
DELETE /api/admin/feature-flags/:key
  Auth: requireDeveloper

WS /ws/feature-flags or SSE /sse/feature-flags
  { "type": "flag.updated", "key": "...", "enabled": true }
```

## Non-Negotiables

1. Flag keys use `be:`, `fe:`, or `fs:` plus kebab-case, for example `be:new-payment-api`, `fe:dark-mode`, `fs:checkout-v2`.
2. Every new flag starts disabled. Never seed a new flag with `enabled = true`.
3. Code behind a disabled flag must still compile and deploy.
4. All checks go through central helpers. Do not scatter `if (process.env.FEATURE_X)` or ad hoc config checks.
5. Backend `isEnabled` must be synchronous and read from loaded in-memory cache. Do not perform database reads in hot paths.
6. On admin update: update DB -> update local cache -> broadcast realtime event. Never broadcast before cache update.
7. The admin UI is grouped by `section`, not a flat list.
8. Use the triple developer check. Do not protect admin endpoints with only one signal.
9. The public endpoint returns only enabled flags and only minimal metadata.
10. When the project uses local iterations, `iteration_id` is an informational string that matches an iteration folder name. It is not a foreign key.

## Workflow

1. Route the task to the relevant references.
2. Inspect `AGENTS.md` and project config (`package.json`, `pom.xml`, `Cargo.toml`, `.csproj`, etc.) to identify the stack and existing conventions.
3. Check whether `feature_flags` already exists before writing migrations.
4. Implement in order: DB -> backend service/cache -> backend API -> realtime -> frontend provider/hook -> admin UI.
5. Add at least one E2E test that creates a flag, enables it, verifies backend `isEnabled=true`, and verifies client update behavior where feasible.
6. Add or update an `AGENTS.md` section listing active feature flags and their state when the project uses repository workflow docs.

## Anti-Patterns

- Async flag lookup in hot paths.
- Environment checks scattered through business code.
- Redis or external services for a developer-only kill switch.
- Flat admin UI with no sections.
- Flags without descriptions.
- Default-on flags.
- Weak admin auth or an unprotected admin endpoint.
- Adding audit logs, tenant targeting, or user targeting without an explicit scope change.
- Public endpoint returning disabled flags or admin metadata.
- Restarting the server to apply flag changes.
- Returning `true` for missing flags; fail closed with `false`.
