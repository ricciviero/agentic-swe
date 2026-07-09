---
name: spring-boot-backend
description: Senior-level Spring Boot backend development in Java. Use this skill whenever the user asks to create, modify, or review Java/Spring Boot code, REST APIs, JPA entities, DTOs, repositories, services, or controllers. Trigger on any mention of Spring Boot, Spring Data, Hibernate, Java backend, Maven, REST API in Java, or Java microservices. Also trigger when the user mentions entity, service layer, repository pattern, or DTO in a Java context. When in doubt, use this skill for any Java backend task.
---

# Spring Boot Backend

Act as a senior backend engineer for Java and Spring Boot REST APIs. Write code, comments, and explanations in clear technical English unless the project explicitly uses another language.

## Required Pattern

Build sequentially, one domain at a time:

```text
Entity -> DTO -> Repository -> Service -> Controller
```

Do not move to the next layer until the current one is complete and correct.

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
2. **DTO**: create dedicated records/classes per use case. Add `jakarta.validation` annotations to every input field. Never expose entities directly. Use `@Validated` on controllers and `@Valid` on parameters.
3. **Repository**: extend `JpaRepository<Entity, ID>`. Prefer Spring Data derived methods unless a custom query is justified. Use `Pageable` and `Sort` for pagination/order.
4. **Service**: use `@Service`, constructor injection, and `@Transactional`. Separate read-only and write transactions. Throw domain exceptions handled by `@ControllerAdvice`.
5. **Controller**: use thin `@RestController` methods under `/api/v1/...`. Validate input, delegate to services, and return DTOs with correct HTTP statuses (`201`, `204`, `400`, `404`, `409`).
6. **OpenAPI**: when springdoc/swagger is present, document new endpoints with `@Tag`, `@Operation`, and the project's existing security requirement.

## Security

- Read `SecurityConfig` before adding protected endpoints.
- Use `BCryptPasswordEncoder` or the project standard for passwords; never store plaintext.
- Keep sensitive values in configuration and profiles; never commit secrets.
- Enable CORS only where required.
- Use SLF4J/Logback; do not use `System.out`.

## Tests

Every backend feature, endpoint change, or business rule change must include relevant tests.

- Unit tests: JUnit 5 + Mockito.
- E2E tests: real HTTP tests with `@SpringBootTest(webEnvironment = RANDOM_PORT)`.

Before editing tests, read the affected controller, service, and DTO source to understand the real API contract. Reuse existing E2E infrastructure if present; otherwise create it. Use a dedicated `test` profile and an isolated database.

Always cover new endpoints for happy path, input validation, unauthorized access, and domain errors.

## Flyway Migrations

Flyway owns the production database schema. Do not use Hibernate `ddl-auto=update` or `ddl-auto=create`.

Before writing a migration, inspect `application.yml` or `application-local.yml` for the real database type and dialect. Put migrations in:

```text
src/main/resources/db/migration/
```

Name files as `V<number>__<snake_case_description>.sql`. Never modify, rename, or delete a committed migration; Flyway checksums will fail. Use `ddl-auto=validate` and make entities match the schema.

## Do Not

- Put business logic in controllers or custom repositories.
- Return entities as API payloads.
- Create generic multi-purpose DTOs.
- Work across multiple unrelated services at once.
- Add nullable fields without justification.
- Use raw types, field injection, setter injection, stack traces in API responses, mocks as production behavior, or unresolved TODOs.

For deeper configuration details, read [references/spring-config.md](references/spring-config.md).
