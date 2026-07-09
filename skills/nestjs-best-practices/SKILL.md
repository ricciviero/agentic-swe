---
name: nestjs-best-practices
description: Senior-level NestJS backend development in TypeScript. Use this skill whenever the user asks to create, modify, or review NestJS code, REST APIs, TypeORM entities, DTOs, modules, services, or controllers. Trigger on any mention of NestJS, Nest, TypeORM, TypeScript backend, REST API in Node, or Node.js microservices. Also trigger when the user mentions entity, service layer, repository pattern, module, or DTO in a NestJS context. When in doubt, use this skill for any NestJS backend task.
---

# NestJS Backend Agent

Use this skill for NestJS backend development with TypeScript: REST APIs, TypeORM entities, DTOs, modules, services, controllers, guards, interceptors, validation, testing, and microservice patterns.

## Load References

Inspect the existing NestJS version, module conventions, and test setup before implementing version-specific patterns.

Use the granular `rules/` files when a request touches a specific concern:

- API and DTOs: `api-use-dto-serialization.md`, `api-use-pipes.md`, `api-use-interceptors.md`, `api-versioning.md`.
- Architecture and modules: `arch-feature-modules.md`, `arch-module-sharing.md`, `arch-single-responsibility.md`, `arch-avoid-circular-deps.md`, `arch-use-repository-pattern.md`.
- DI: `di-prefer-constructor-injection.md`, `di-use-interfaces-tokens.md`, `di-scope-awareness.md`, `di-avoid-service-locator.md`.
- Database: `db-use-migrations.md`, `db-use-transactions.md`, `db-avoid-n-plus-one.md`.
- Security: `security-auth-jwt.md`, `security-use-guards.md`, `security-validate-all-input.md`, `security-rate-limiting.md`, `security-sanitize-output.md`.
- Error handling, testing, perf, microservices, and devops: read the matching rule file.

## Core Workflow

Develop one domain at a time:

```text
Entity -> DTO -> Module -> Repository/Service -> Controller -> tests
```

Do not jump layers until the current layer is coherent with the project conventions.

## Non-Negotiables

- Keep modules feature-oriented and boundaries explicit.
- Validate all external input with DTOs/pipes.
- Do not leak entities directly as public API responses unless the project explicitly does so.
- Use constructor injection; avoid service locator patterns.
- Keep controllers thin and services focused.
- Use migrations for schema changes.
- Add transactions around multi-write consistency boundaries.
- Map errors to correct HTTP exceptions and avoid swallowing async errors.
- Run build/lint/tests appropriate to the touched surface.

## Delivery Checklist

- DTOs, entities, services, and controllers follow existing naming.
- Validation and serialization are explicit.
- Auth/authorization is enforced at the correct layer.
- Database access avoids obvious N+1 paths.
- Tests cover behavior when the change touches shared contracts or user-facing endpoints.
