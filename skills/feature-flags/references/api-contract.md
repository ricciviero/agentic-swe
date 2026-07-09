# API Contract

Every backend implementation must expose the same payloads so Next.js, Angular, React Native, and other clients can share the same feature-flag behavior.

## Public Endpoint

### `GET /api/feature-flags`

Returns only currently enabled flags with minimal metadata.

```json
[
  { "key": "fs:checkout-v2", "scope": "fullstack" },
  { "key": "fe:dark-mode", "scope": "frontend" },
  { "key": "be:new-search", "scope": "backend" }
]
```

Rules:

- Return only `enabled = true`.
- Do not include `description`, `section`, `name`, or `iterationId`.
- Do not paginate; the list should remain small.
- Use `Cache-Control: no-cache`; clients rely on realtime updates.
- Do not require auth.

## Admin Endpoints

All admin endpoints require `requireDeveloper`.

### `GET /api/admin/feature-flags`

Return the complete list ordered by `section ASC, key ASC`.

```json
[
  {
    "id": "01935b00-...-...-...-...",
    "key": "fs:checkout-v2",
    "name": "Checkout v2 UI",
    "description": "Replaces the payment flow with the new design.",
    "section": "Checkout",
    "scope": "fullstack",
    "enabled": false,
    "iterationId": "03-checkout-v2",
    "createdAt": "2026-05-28T10:00:00Z",
    "updatedAt": "2026-05-28T10:00:00Z"
  }
]
```

### `POST /api/admin/feature-flags`

Creates a new flag with `enabled = false`.

```json
{
  "key": "fs:checkout-v2",
  "name": "Checkout v2 UI",
  "description": "Replaces the payment flow.",
  "section": "Checkout",
  "scope": "fullstack",
  "iterationId": "03-checkout-v2"
}
```

Validation:

- `key`: `^(be|fe|fs):[a-z0-9-]+$`, unique.
- `scope` must match prefix: `be:` -> `backend`, `fe:` -> `frontend`, `fs:` -> `fullstack`.
- `name` and `section` must be non-empty.
- `iterationId` is optional.

Return `201 Created` and broadcast `flag.created`.

### `PATCH /api/admin/feature-flags/:key`

Updates `enabled` and optionally editable metadata.

```json
{ "enabled": true }
```

Required side-effect order:

1. Update DB.
2. Update local in-memory cache.
3. Broadcast realtime update.

Returning the realtime event before cache update creates a race.

### `DELETE /api/admin/feature-flags/:key`

Deletes a retired flag and broadcasts `flag.deleted`. Return `204 No Content`.

## Realtime Protocol

Use `/ws/feature-flags` for WebSocket or `/sse/feature-flags` for SSE.

```json
{ "type": "flag.created", "key": "fs:foo", "scope": "fullstack" }
{ "type": "flag.updated", "key": "fs:foo", "enabled": true }
{ "type": "flag.deleted", "key": "fs:foo" }
```

The realtime stream is public because active flag state is public. It must not include admin metadata.

Ping every 30 seconds with `{ "type": "ping" }`; close the connection after two missed replies. If realtime fails, clients poll `GET /api/feature-flags` every 5 seconds and apply diffs.

```typescript
type FeatureFlagsConfig = {
  apiUrl: string;
  wsUrl: string;
  fallbackPollMs?: number;
  maxReconnectAttempts?: number;
  reconnectDelayMs?: number;
};
```

## Errors

Use Problem Details style errors for admin endpoints:

```json
{
  "type": "https://example.com/errors/VALIDATION",
  "title": "Validation failed",
  "status": 400,
  "detail": "Field 'key' does not match pattern.",
  "errors": { "key": ["pattern", "uniqueness"] },
  "traceId": "abc123"
}
```

Use `401` for unauthenticated users and `403` for authenticated users who are not developers.

## Health and OpenAPI

Optional health endpoint:

```text
GET /api/feature-flags/health
```

Return `{ "status": "ok", "flagsCount": 12, "cacheLoadedAt": "..." }`.

Document all endpoints in OpenAPI under a dedicated `feature-flags` tag.
