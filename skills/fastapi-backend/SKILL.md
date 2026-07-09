---
name: fastapi-backend
description: REST backend development with FastAPI aligned to enterprise patterns such as Spring Boot and NestJS. Use for new API services, layer refactors, Pydantic v2 schemas, persistence, E2E tests, OpenAPI, and security.
---

# FastAPI Backend

Act as a senior backend engineer for REST APIs and enterprise systems using **Python 3.11+**, **FastAPI**, and **Pydantic v2**. Write code, comments, and explanations in clear technical English unless the project explicitly uses another language.

This skill mirrors `spring-boot-backend` and `nestjs-best-practices`: data model -> API contracts -> data access -> service -> HTTP layer, with strict validation, correct HTTP errors, migrations, and E2E tests.

## Required Pattern

Build sequentially, one domain at a time:

```text
Persistence model -> Pydantic schema -> Repository / data access -> Service -> Router (APIRouter)
```

Do not move to the next layer until the current one is complete and consistent with the project. After substantial changes, run format, lint, and tests for the touched package.

## Project Shape

Always inspect the existing layout first. For a new project, prefer:

```text
src/app/
  main.py
  api/
    deps.py
    v1/
      router.py
      endpoints/
        {domain}.py
  core/
    config.py
    security.py
    exceptions.py
  domain/
    {domain}/
      models.py
      schemas.py
      repository.py
      service.py
  db/
    session.py
    migrations/
```

Small projects may use a flatter `backend/` package. The rule is layer separation, not folder names.

## Naming

| Element | Convention | Example |
|---|---|---|
| Packages / folders | snake_case | `domain/users/` |
| FastAPI router file | `{resource}.py` or `{resource}_router.py` | `users.py` |
| Request schema | `CreateUserRequest`, `UpdateUserRequest` | `BaseModel` |
| Response schema | `UserResponse`, `UserListResponse` | - |
| Service | `UserService` | - |
| Repository | `UserRepository` | - |
| SQL table | plural snake_case | `user_accounts` |
| Endpoint | `/api/v1/<kebab-resource>` | `/api/v1/user-groups/{id}` |
| Functions / variables | snake_case | `find_by_email` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE` |

Use `APIRouter(prefix="/...", tags=[...])` and mount routes under `/api/v1`.

## Layer Rules

1. **Persistence model**: use SQLAlchemy 2 `Mapped` and `mapped_column` when SQLAlchemy is present. Declare table names, types, nullability, uniqueness, and indexes explicitly. Keep business logic out of entities.
2. **Pydantic schema**: use Pydantic v2 (`ConfigDict`, `@field_validator`, `@model_validator`). Add explicit input constraints. Never expose ORM models directly in responses. Keep separate create, update, filter, and response schemas.
3. **Repository / data access**: encapsulate DB sessions and queries. Do not know about HTTP or status codes. Make pagination and ordering explicit.
4. **Service**: hold business logic and use cases. Inject dependencies through constructors or explicit factories. Map domain exceptions to HTTP in exception handlers or middleware. Use one session/transaction per atomic use case.
5. **Router**: keep `APIRouter` methods thin. Let Pydantic validate, call services, and return typed responses with correct status codes (`201`, `204`, `400`, `404`, `409`). Put shared dependencies in `deps.py`.
6. **OpenAPI**: provide `summary`, `description`, `response_model`, and typed error `responses`. Use domain tags and the project's existing auth scheme.

## Lifecycle, Config, and Security

- Use FastAPI `lifespan` for startup/shutdown resources; do not couple heavy work to module imports.
- Load configuration with `pydantic-settings`. Never hardcode secrets or commit real `.env` values.
- Read existing `SecurityConfig` / dependency code before adding protected routes.
- Hash passwords with argon2 or bcrypt according to the project standard.
- Restrict CORS to required origins.
- Use `logging` or `structlog`; do not use `print` in production code.
- Error responses must be safe for clients and must not expose stack traces.

## Database Migrations

Use Alembic as the production schema source of truth. Do not use `create_all` or implicit schema sync in production.

Before writing migrations, inspect `DATABASE_URL`, driver, and dialect. Use compatible SQL/types for PostgreSQL, MySQL, SQLite, or the actual target. Never modify revisions already applied in shared environments.

Workflow: update SQLAlchemy model -> generate migration -> inspect the diff -> test on a clean database.

## Tests

Every new feature, API contract change, or business rule change requires automated tests.

- Unit tests: `pytest` with repository/service mocks where useful.
- API tests: `httpx.AsyncClient` with `ASGITransport(app=...)` or `TestClient`, using the real app lifespan and middleware.

Required process:

1. Read the relevant router, service, and schema before changing tests.
2. Add or update tests under `tests/`, mirroring the domain structure.
3. Run `pytest` or the project test command and make all tests pass.
4. If behavior intentionally changes, update affected tests in the same change.

Always cover new endpoints for happy path, input validation (`422`), missing resources (`404`), and auth (`401`/`403`) when applicable.

## Do Not

- Put business logic in routers or raw repositories without a service.
- Expose ORM models as `response_model`.
- Rely only on client-side validation.
- Ignore un-awaited async errors.
- Hide mutable global dependencies; prefer `Depends` and explicit factories.

For projects without SQLAlchemy, keep the same Service + Router + Schema separation. The repository may be an adapter to files, Qdrant, HTTP, or another backend.
