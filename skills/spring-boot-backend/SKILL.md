---
name: spring-boot-backend
description: Implement or review Java Spring Boot APIs, persistence, security, services, and tests. Use for Spring Boot compatibility, REST contracts, Spring Data/JPA, migrations, Maven/Gradle, and backend architecture; preserve the project's selected versions and conventions.
---

# Spring Boot Backend

Act as a senior backend engineer for Java and Spring Boot REST APIs. Write code, comments, and explanations in clear technical English unless the project explicitly uses another language.

## First Pass and Compatibility

Inspect project instructions, the build wrapper, Java toolchain, Spring Boot/BOM version, database and migration ownership, security configuration, API error contract, and tests before editing. Research-only requests do not authorize running or scaffolding the application.

Read [boot-4-compatibility.md](references/boot-4-compatibility.md) for a new Boot 4 application or a requested upgrade. Verify official Java/framework/build-tool compatibility and third-party integrations; do not transplant Boot 3 examples into Boot 4 or upgrade an existing app as a side effect.

Use Boot-managed dependency versions unless a verified requirement justifies an override. For new projects, propose a compatible supported set; an example version is not a permanent global default.

## Required Pattern

Build sequentially, one domain at a time:

```text
Entity -> DTO -> Repository -> Service -> Controller
```

Use this order when it fits the feature; preserve an established architecture and validate the resulting behavior across layers. Do not create empty layers or service interfaces merely to match the example.

## Project Shape

```text
src/main/java/com/example/app/
  config/
  common/
  domain/
    {domain}/
      entity/
      dto/
      repository/
      service/
      controller/
      mapper/       (optional, MapStruct)
  Application.java
src/main/resources/
  application.yml
  application-{profile}.yml
```

## Naming

| Element | Convention | Example |
|---|---|---|
| Package | lowercase dot notation | `com.example.app.domain.users` |
| Classes | PascalCase | `UserController`, `UserService` |
| JPA entity | follow project convention; declare table name | `@Table(name = "...")` |
| Request DTO | descriptive suffix | `CreateUserRequest`, `UpdateUserRequest` |
| Response DTO | `Response` suffix | `UserResponse` |
| Repository | `XxxRepository extends JpaRepository` | - |
| Service | `XxxService`; `Impl` only for multiple implementations | - |
| Endpoint | `/api/v1/<kebab-resource>` | `/api/v1/user-groups/{id}` |
| Beans / variables | camelCase | - |
| Constants | UPPER_SNAKE_CASE | - |

## Layer Rules

1. **Entity**: use explicit `@Entity`, `@Table`, and `@Column` metadata. Confirm ID strategy from the project. Define fetch and cascade behavior explicitly. Keep application logic out of entities.
2. **DTO**: create dedicated records/classes per use case. Apply `jakarta.validation` constraints that reflect the real input contract. Never expose entities directly. Use `@Valid` for aggregate request validation and the method-validation mechanism appropriate to the selected Spring version; do not add class-level `@Validated` blindly to modern MVC controllers.
3. **Repository**: extend `JpaRepository<Entity, ID>`. Prefer Spring Data derived methods unless a custom query is justified. Use `Pageable` and `Sort` for pagination/order.
4. **Service**: use `@Service`, constructor injection, and `@Transactional`. Separate read-only and write transactions. Throw domain exceptions handled by `@ControllerAdvice`.
5. **Controller**: use thin `@RestController` methods under `/api/v1/...`. Validate input, delegate to services, and return DTOs with correct HTTP statuses (`201`, `204`, `400`, `404`, `409`).
6. **OpenAPI**: when springdoc/swagger is present, document new endpoints with `@Tag`, `@Operation`, and the project's existing security requirement.

## Security

- Read `SecurityConfig` before adding protected endpoints.
- Use `BCryptPasswordEncoder` or the project standard for passwords; never store plaintext.
- Keep secrets in infrastructure-managed configuration/secret storage; never commit or log them. Profiles and environment variables are not a normal operator UI for product-managed settings.
- Enable CORS only where required.
- Use SLF4J/Logback; do not use `System.out`.

## Tests

Every backend feature, endpoint change, or business rule change must include relevant tests.

- Unit tests: JUnit Jupiter and Mockito at the versions managed by the selected Boot release (Boot 4 uses JUnit 6); do not independently pin JUnit 5 in a Boot 4 app.
- E2E tests: real HTTP tests with `@SpringBootTest(webEnvironment = RANDOM_PORT)`.

Before editing tests, read the affected controller, service, and DTO source to understand the real API contract. Reuse existing E2E infrastructure if present; otherwise create it. Use a dedicated `test` profile and an isolated database.

Always cover new endpoints for happy path, input validation, unauthorized access, and domain errors.

## Flyway Migrations

Preserve the project's chosen migration tool. When Flyway is selected, it owns the schema in local/test/production environments; do not create competing Docker init SQL or Hibernate schema-update paths. Do not use Hibernate `ddl-auto=update` or `ddl-auto=create` for production schema management.

Before writing a migration, inspect `application.yml` or `application-local.yml` for the real database type and dialect. Put migrations in:

```text
src/main/resources/db/migration/
```

Name files as `V<number>__<snake_case_description>.sql`. Do not rewrite an applied/shared migration; add a corrective migration. Use `ddl-auto=validate` and make entities match the schema. Keep development seeds separate from production data and verify startup on an empty database.

## Do Not

- Put business logic in controllers or custom repositories.
- Return entities as API payloads.
- Create generic multi-purpose DTOs.
- Work across multiple unrelated services at once.
- Add nullable fields without justification.
- Use raw types, field injection, setter injection, stack traces in API responses, mocks as production behavior, or unresolved TODOs.

For deeper configuration details, read [references/spring-config.md](references/spring-config.md).
