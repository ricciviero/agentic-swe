# Rust Full-Stack Web Reference

Use this reference for product applications that combine a Rust UI, server rendering, browser interactions, HTTP APIs, persistence, authentication, realtime updates, and deployment.

Research baseline: 2026-07-24. Inspect the project's lockfile and current upstream documentation before changing dependency versions.

## Contents

- [Default Architecture](#default-architecture)
- [Version and Compatibility Baseline](#version-and-compatibility-baseline)
- [Project Shape](#project-shape)
- [Request and Data Boundaries](#request-and-data-boundaries)
- [Leptos SSR and Progressive Enhancement](#leptos-ssr-and-progressive-enhancement)
- [Browser Authentication and Security](#browser-authentication-and-security)
- [Database and Transactions](#database-and-transactions)
- [HTTP Middleware and External APIs](#http-middleware-and-external-apis)
- [Realtime Features](#realtime-features)
- [Errors and User Experience](#errors-and-user-experience)
- [Testing Strategy](#testing-strategy)
- [Build, Deploy, and Operate](#build-deploy-and-operate)
- [Delivery Checklist](#delivery-checklist)
- [Official Sources](#official-sources)

## Default Architecture

For a new Rust-first web product, choose:

```text
Browser
  ├─ initial document/navigation ──> Leptos SSR routes
  ├─ first-party reads/mutations ──> Leptos server functions
  ├─ enhanced interactions ────────> hydrated Leptos/WASM
  └─ notifications ────────────────> SSE by default
                                         │
Axum router ──> thin transport adapters ─┤
                                         v
                             application services
                               │        │
                           domain     repositories
                                         │
                                  SQLx + PostgreSQL

External clients ──> /api/v1 REST ──> the same application services
```

Use Leptos SSR with hydration on Axum as the baseline. It provides fast first render, Rust types across the UI/server boundary, and optional client interactivity without requiring every product flow to become a JavaScript-only SPA.

Do not force this stack when:

- the repository already has a healthy frontend architecture;
- a large third-party JavaScript ecosystem is a primary product requirement;
- static generation or a small client-only widget fully solves the problem;
- native mobile and desktop parity matters more than SSR;
- the team cannot operate the Rust/WASM build and browser test toolchain.

Choose one application service layer. Server functions, REST handlers, scheduled jobs, and realtime producers are adapters into it; none should duplicate business rules.

## Version and Compatibility Baseline

The verified upstream baseline on the research date is:

| Component | Baseline | Decision |
|---|---:|---|
| Leptos | 0.8.x | SSR, hydration, routing, resources, actions, and server functions |
| `leptos_axum` | 0.8.x | Connect Leptos routes and server functions to Axum |
| Axum | 0.8.x | HTTP router, extractors, middleware integration, SSE, WebSockets |
| SQLx | 0.9.x | PostgreSQL, migrations, compile-time checked queries, offline metadata |
| `tower-sessions` | 0.15.x | Opaque browser session ID with a server-side store |
| `tower-http` | 0.7.x | Trace, request ID, limits, timeout, compression, CORS, sensitive headers |

Prefer the versions already pinned by an existing application. Upgrade as a separate, validated change when the repository is behind.

Compatibility warning: `tower-sessions-sqlx-store` 0.15 still depends on SQLx 0.8 at this baseline. Do not add it mechanically to a SQLx 0.9 application. Use a compatible Redis-backed store, implement and test a deliberate store, or keep the whole application on SQLx 0.8 until the adapter catches up. Avoid two SQLx major/minor lines for the same database boundary.

## Project Shape

Start from the official `leptos-rs/start-axum` template for a new application. Keep its `ssr` and `hydrate` feature split intact.

For a small product, organize one crate by responsibility:

```text
src/
  app.rs                 Leptos shell and route tree
  components/            reusable presentation
  pages/                 route-level views
  server_functions/      first-party transport adapters
  api/                   versioned external REST adapters
  application/           use cases, authorization, transaction orchestration
  domain/                domain types, rules, ports
  infrastructure/
    postgres/            SQLx repository implementations
    sessions/            session-store wiring
  auth/                  password/session/CSRF policy
  error.rs               typed internal and public errors
  state.rs               cloneable process state
  main.rs                configuration, wiring, router, shutdown
migrations/
end2end/
```

Split crates only when boundaries are real:

- `domain`: pure rules with no Axum, Leptos, or SQLx types;
- `application`: use cases and repository traits;
- `web`: Leptos components plus serializable boundary types;
- `server`: Axum, SQLx, sessions, configuration, and process wiring.

Do not start with a large workspace merely to imitate clean architecture. A module boundary is enough until independent compilation, ownership, or reuse justifies a crate.

Keep `AppState` cheap to clone. Store handles such as `PgPool`, immutable configuration, HTTP clients, and service `Arc`s. Never store request-local identity or an open transaction in global state.

## Request and Data Boundaries

Maintain four distinct models:

1. transport input/output for server functions or REST;
2. application commands and queries;
3. domain types and invariants;
4. database rows.

Conversions are explicit. Never expose a SQLx row directly to the browser.

Use this flow for every entry point:

```text
decode -> validate shape -> authenticate -> authorize use case
       -> execute transaction/domain behavior -> map public response
```

Validate cheap syntax at the transport boundary. Enforce invariants and authorization in the application/domain layer so every adapter receives the same protection.

Use typed IDs, explicit tenant context, and exhaustive states. In multi-tenant systems, make `TenantId` a required argument to repository operations and test that cross-tenant access fails.

## Leptos SSR and Progressive Enhancement

Use server functions for first-party UI calls when they reduce duplicate transport code. A server function is still a public HTTP endpoint:

- accept explicit, serializable input;
- authenticate and authorize every invocation;
- validate input again on the server;
- call an application service;
- return a stable, user-safe error type;
- never embed business rules in the generated transport function.

Use `Resource` for reads and `ServerAction` or `<ActionForm/>` for mutations. Refetch or invalidate the affected resource after success. Prefer a redirect after a successful create/update when it yields a durable URL and sensible browser history.

Use native links, buttons, labels, and forms. Make important navigation and form workflows work before hydration when feasible. `<ActionForm/>` sends a normal URL-encoded POST when JavaScript/WASM is unavailable; reserve client-only handlers for interactions that genuinely require them.

Render all meaningful async states:

- loading or streaming fallback;
- empty state;
- typed recoverable error;
- not found;
- unauthorized/forbidden;
- success confirmation.

Do not create hydration divergence:

- keep initial server and client markup deterministic;
- do not read browser-only APIs during SSR;
- isolate `window`, storage, timers, and DOM access behind the hydrate target;
- pass server-derived initial data through supported Leptos primitives, not duplicated fetches in effects.

Use islands only when most of a page should remain static and a few regions need hydration. Use full hydration for application shells with broad interactivity.

## Browser Authentication and Security

For same-origin browser authentication, default to email/password plus an opaque server-side session:

1. normalize and validate the identifier;
2. load the account without revealing whether it exists;
3. verify an Argon2id hash in `spawn_blocking`;
4. rate-limit attempts by an appropriate combination of account and client signals;
5. rotate the session ID after successful authentication;
6. store only minimal identity/session state;
7. redirect to a safe, validated local destination.

Configure the session cookie deliberately:

```text
name: __Host-session
Secure: true in HTTPS environments
HttpOnly: true
SameSite: Lax or Strict according to the navigation model
Path: /
Domain: absent
```

Use HTTPS for the entire authenticated session. Keep secrets, session IDs, access tokens, and refresh tokens out of `localStorage`, `sessionStorage`, URLs, logs, and serialized Leptos state.

On login and privilege change, cycle the session ID. On logout, flush both server-side data and the browser cookie. Define idle and absolute expiry. A process-memory store is development-only; use a shared store when multiple replicas can serve the same user.

Cookie authentication makes every state-changing endpoint CSRF-sensitive, including server functions and progressively enhanced forms:

- never mutate state on `GET`, `HEAD`, or `OPTIONS`;
- use a synchronizer token, or a correctly session-bound signed double-submit design;
- include the token in a hidden form field or custom request header, never in a URL;
- verify `Origin`, falling back deliberately to `Referer` when appropriate;
- consider Fetch Metadata as another rejection signal;
- treat `SameSite` as defense in depth, not the only control.

For credentialed cross-origin requests, allow only exact trusted origins, methods, and headers. Never combine credentials with a reflected arbitrary origin or wildcard policy.

Keep browser sessions and external API credentials separate. Add short-lived bearer access tokens only for mobile, CLI, machine-to-machine, or third-party API consumers that need them. Do not make a browser SPA persist a long-lived JWT merely because REST endpoints exist.

Authorization belongs at each application use-case boundary. UI visibility, router guards, and middleware are conveniences, not the final enforcement point.

Also apply:

- generic login and password-reset responses;
- one-time, expiring reset tokens stored as hashes;
- password re-verification for destructive or security-sensitive actions;
- output encoding and a restrictive Content Security Policy;
- body-size, upload-type, and decompression limits;
- no secrets or personal data in tracing fields.

## Database and Transactions

Use a bounded `PgPool` created during process startup. Fail startup on invalid configuration or unreachable mandatory dependencies when that is the deployment contract.

Use checked SQLx macros for stable queries. In CI:

1. run migrations against a disposable PostgreSQL database;
2. run `cargo sqlx prepare --check` when the project commits `.sqlx` offline metadata;
3. compile and test with `SQLX_OFFLINE=true` where the release build must not access a database.

Commit migrations and `.sqlx` metadata when offline builds depend on them. Never edit an applied migration; add a new one.

Application services own transaction boundaries. Pass `&mut Transaction<'_, Postgres>` or a narrow executor/repository abstraction through operations that must commit atomically. Do not open a transaction in a handler and leak it into UI code.

Make writes retry-safe where duplicates are costly:

- database uniqueness constraints for invariants;
- idempotency keys for externally retried commands;
- optimistic concurrency or row locks for contested updates;
- an outbox when a database commit and an external event must be coordinated.

Avoid N+1 queries, unbounded lists, and `SELECT *`. Paginate with stable ordering and prefer keyset pagination for large, changing collections.

## HTTP Middleware and External APIs

Construct the Axum router from explicit public, authenticated, administrative, and health subrouters. Apply layers at the narrowest correct scope and test layer ordering.

The production middleware baseline is:

- trusted-proxy handling only when the deployment topology defines it;
- request ID generation and propagation;
- structured tracing with sensitive headers marked;
- body-size and request timeout limits;
- authentication/session loading;
- CSRF enforcement for browser mutations;
- compression for suitable response types;
- exact CORS policy only where cross-origin access is required;
- a final error mapping that does not disclose internals.

Use `tower-http` rather than custom middleware for standard HTTP concerns. Do not log `Authorization`, `Cookie`, `Set-Cookie`, reset tokens, or request bodies by default.

Expose versioned REST routes such as `/api/v1/...` for integrations and non-browser clients. REST handlers and Leptos server functions call the same use case. Keep their DTOs separate when their compatibility promises differ.

Document public APIs with `utoipa` when an OpenAPI contract is a deliverable. Stabilize status codes, error codes, pagination, idempotency behavior, and deprecation policy before publishing a client contract.

## Realtime Features

Choose the least complex transport:

| Need | Default |
|---|---|
| server-to-browser notifications or progress | SSE |
| bidirectional collaboration, presence, or streaming commands | WebSocket |
| infrequent updates tolerant of latency | polling with conditional requests |

Authenticate and authorize before opening the stream or completing a WebSocket upgrade. Revalidate access when subscriptions change.

For SSE:

- send keep-alives through proxies;
- use event IDs when resumption matters;
- define client reconnect behavior;
- bound per-client queues and disconnect slow consumers.

For WebSockets:

- cap frame/message sizes;
- validate every message as untrusted input;
- implement ping/idle timeout and graceful close;
- split read/write only with an explicit cancellation plan;
- use bounded channels and define backpressure/drop behavior.

In a multi-replica deployment, do not use process-local broadcast as the source of truth. Use a shared broker or durable event source and make reconnect/resume semantics explicit.

## Errors and User Experience

Use typed internal errors and map them once at transport boundaries.

Separate:

- validation errors the user can correct;
- unauthenticated and forbidden outcomes;
- not found and conflict;
- rate limiting and temporary dependency failure;
- internal failure with a correlation/request ID.

Return stable public error codes without SQL, filesystem paths, tokens, stack traces, or internal cause chains. Log the full cause server-side with the request ID.

SSR routes need an intentional error page and status code. Server functions need serializable user-safe errors. REST APIs need a consistent error envelope. Realtime protocols need an explicit close/error event contract.

## Testing Strategy

Use a layered suite:

1. unit tests for domain rules, validation, authorization decisions, and error mapping;
2. application tests with deterministic fakes for external ports;
3. Axum router tests using `tower::ServiceExt::oneshot`;
4. SQLx repository tests against real PostgreSQL, preferably through Testcontainers;
5. browser E2E tests with the official starter's Playwright integration;
6. load tests for login, expensive queries, and realtime fan-out when relevant.

The browser suite must cover:

- first SSR response and correct HTTP status;
- hydration without console errors;
- one critical form with JavaScript enabled;
- the progressively enhanced path with JavaScript disabled where promised;
- login, session rotation, logout, and expiry behavior;
- CSRF rejection;
- authorization and multi-tenant isolation;
- validation and recoverable server errors;
- reconnect behavior for realtime features.

Use random available ports and isolated databases. Run migrations for each integration environment. Do not make tests depend on execution order, wall-clock sleeps, or a developer's local database.

Recommended validation for a full-stack change:

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo nextest run --workspace --all-features
cargo sqlx prepare --check
cargo leptos build --release
cargo leptos end-to-end --release
```

Adapt commands to the repository. Do not claim a browser path is validated when only Rust unit tests ran.

## Build, Deploy, and Operate

Build release artifacts with:

```bash
cargo leptos build --release
```

Package the native server binary together with the generated `site` directory. Use a multi-stage container build or an equivalent reproducible release process. The runtime image does not need the Rust/WASM build toolchain.

Before rollout:

- build with locked dependencies;
- scan dependencies and the runtime image;
- apply migrations as a controlled one-shot release step;
- verify required environment variables and secret references;
- smoke-test the exact artifact.

Do not let every replica race to run schema migrations during startup.

Expose separate liveness and readiness behavior. Liveness should show that the process can serve; readiness should fail when the instance cannot safely receive traffic. Avoid turning a transient database failure into an automatic restart loop through an over-eager liveness probe.

Use `axum::serve(...).with_graceful_shutdown(...)`. On termination:

1. stop accepting new traffic;
2. signal background tasks and realtime connections;
3. drain in-flight work within a deadline;
4. close pools and flush telemetry where required;
5. exit non-zero if shutdown integrity fails materially.

Keep all runtime state outside the container: PostgreSQL for durable data, a shared session store for browser sessions, object storage for uploads, and a broker/durable source for cross-replica realtime events.

Terminate TLS at a known reverse proxy or load balancer. Define trusted forwarding headers, external origin, secure-cookie behavior, compression ownership, and security-header ownership in configuration rather than guessing from arbitrary request headers.

Record at least:

- request rate, latency, status, and saturation;
- database pool wait/usage and slow queries;
- login failures and rate-limit decisions without credentials;
- server-function and REST error codes;
- active realtime connections, queue pressure, and disconnect reason;
- build revision and migration revision.

## Delivery Checklist

- [ ] Existing Rust, framework, and database versions were inspected.
- [ ] The official Axum starter or the repository's established build shape is preserved.
- [ ] Server functions and REST handlers contain no duplicate domain rules.
- [ ] Browser sessions are opaque, rotated, expiring, shared across replicas, and stored only in hardened cookies.
- [ ] Every cookie-authenticated mutation has an explicit CSRF defense.
- [ ] Authorization is enforced in application services, including tenant scope.
- [ ] SQLx migrations and offline metadata are reproducible.
- [ ] CORS is absent unless required, otherwise exact and credential-safe.
- [ ] Realtime transport, backpressure, authentication, and reconnect behavior are defined.
- [ ] SSR, hydration, real PostgreSQL, and the critical browser path were tested.
- [ ] Release artifacts include the server binary and site assets.
- [ ] Migrations, readiness, graceful shutdown, secrets, and observability are deployment-ready.

## Official Sources

- [Leptos Axum starter](https://github.com/leptos-rs/start-axum)
- [Leptos server functions](https://book.leptos.dev/server/25_server_functions.html)
- [Leptos progressive enhancement and ActionForm](https://book.leptos.dev/progressive_enhancement/action_form.html)
- [Leptos SSR deployment](https://book.leptos.dev/deployment/ssr.html)
- [`leptos_axum` integration](https://docs.rs/leptos_axum/latest/leptos_axum/)
- [Axum documentation](https://docs.rs/axum/latest/axum/)
- [Axum WebSockets](https://docs.rs/axum/latest/axum/extract/ws/)
- [Axum SSE](https://docs.rs/axum/latest/axum/response/sse/)
- [SQLx documentation](https://docs.rs/sqlx/latest/sqlx/)
- [SQLx checked queries and offline mode](https://docs.rs/sqlx/latest/sqlx/macro.query.html)
- [`tower-sessions` documentation](https://docs.rs/tower-sessions/latest/tower_sessions/)
- [`tower-http` documentation](https://docs.rs/tower-http/latest/tower_http/)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
