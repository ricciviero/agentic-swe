# Backend Patterns

All backend implementations share one service contract:

```text
FeatureFlagsService
  cache: Map<key, enabled>
  loadAll()              load cache from DB on boot
  isEnabled(key): bool   synchronous, fail-closed
  create(dto)            DB -> cache -> broadcast flag.created
  patch(key, dto)        DB -> cache -> broadcast flag.updated
  delete(key)            DB -> cache -> broadcast flag.deleted
```

Do not add Redis, external flag services, or asynchronous hot-path lookups for this developer-only module.

## NestJS

- Module: `FeatureFlagsModule`.
- Persistence: TypeORM/Prisma entity matching `feature_flags`.
- Service: implements `OnApplicationBootstrap` and loads all flags into a `Map<string, boolean>`.
- Public controller: `GET /api/feature-flags`.
- Admin controller: `GET/POST/PATCH/DELETE /api/admin/feature-flags` with JWT guard plus `DeveloperGuard`.
- Realtime: Socket.io gateway at `/ws/feature-flags`.

```typescript
isEnabled(key: string): boolean {
  return this.cache.get(key) ?? false;
}
```

## Spring Boot

- Entity: `FeatureFlagEntity`.
- Repository: `FeatureFlagRepository extends JpaRepository<FeatureFlagEntity, UUID>`.
- Service: `@Service` with `ConcurrentHashMap<String, Boolean>` cache and `@PostConstruct`/application event loading.
- Controllers: public and admin controllers under `/api/feature-flags` and `/api/admin/feature-flags`.
- Realtime: Spring WebSocket, SSE, or application event bridge.

## .NET Minimal API

- Entity: `FeatureFlag`.
- DbContext: add `DbSet<FeatureFlag>`.
- Service: singleton cache loaded at startup; mutation methods use scoped DbContext.
- Endpoints: map public endpoint anonymously and admin endpoint group with authorization plus developer policy.
- Realtime: SignalR hub or SSE endpoint.

## FastAPI

- Model: SQLAlchemy or SQLModel table matching the canonical schema.
- Service: app-scoped cache initialized in `lifespan`.
- Routes: `APIRouter` for public and admin endpoints.
- Auth: dependency `require_developer`.
- Realtime: SSE is usually simpler than WebSocket for one-way flag updates.

## Rust/Axum

- Model: SQLx row or SeaORM entity.
- State: `Arc<RwLock<HashMap<String, bool>>>` or equivalent.
- Handlers: public and admin routes.
- Auth: middleware validates developer identity and DB marker.
- Realtime: WebSocket or SSE using broadcast channels.

## Test Requirements

Add an E2E test that:

1. Creates a disabled flag.
2. Confirms it is absent from `GET /api/feature-flags`.
3. Enables it through the admin endpoint.
4. Confirms `isEnabled(key)` returns true.
5. Confirms the public endpoint and realtime channel expose the update where feasible.
