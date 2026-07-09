# Admin UI Panel

The admin UI is developer-only and should feel like an operational tool, not a marketing page.

## Required Behavior

- Group flags by `section`; do not show one flat list.
- Toggle updates optimistically and rolls back on failure.
- Show realtime connection state: connected, polling fallback, or offline.
- Reflect updates from another browser tab or device immediately.
- Provide search by `key` and `name`.
- Provide a create-flag form with `key`, `name`, `description`, `section`, `scope`, and optional `iterationId`.
- Match the host app design system.

## Layout

```text
Feature Flags - Admin                         [Connected]
9 flags total - 3 enabled                       [New]

Search...

Auth (2)
  be:new-login-flow        [backend]   enabled
  fs:2fa-mandatory         [fullstack] disabled

Checkout (3)
  fs:checkout-v2           [fullstack] enabled
```

## Optimistic Toggle

1. User toggles a switch.
2. UI immediately reflects the target state.
3. Send `PATCH /api/admin/feature-flags/:key`.
4. On success, keep state.
5. On failure, roll back and show an error.

## Realtime Conflict

If the user is editing a flag while a realtime update arrives for the same key, show a warning that the flag changed elsewhere and offer reload/continue actions.

## Empty and Error States

- Empty: "No feature flags configured. Create the first one to get started."
- Offline: show cached state with an explicit stale-state warning.
- Mutation error: identify the flag key and failed action.

Do not include private recipient IDs, personal emails, or project-specific inventories in the UI scaffolding.
