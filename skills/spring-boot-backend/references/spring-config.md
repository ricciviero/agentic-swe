# Spring Boot Configuration

Use examples only after selecting the actual database, Boot major, authentication contract, and deployment layout. Read boot-4-compatibility.md for Boot 4; do not copy independently pinned dependency versions from another major.

## Environment and Profiles

Use normal Spring externalized configuration for infrastructure-managed endpoints, credentials, bootstrap settings, and startup options. Keep development, test, and production values explicit. A Compose env file passes environment variables to the container; Spring does not automatically parse arbitrary shell dotenv syntax as application properties.

Product-managed runtime settings need canonical persistence, authorized APIs, effective-state readback, and an operator UI where applicable. Do not substitute an env edit or direct SQL update for that normal workflow.

This fragment illustrates a PostgreSQL application only when PostgreSQL has been chosen:

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  flyway:
    enabled: true

management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      show-details: when-authorized
```

Select matching Flyway/database dependencies in the build; the configuration fragment does not install them. Let the JDBC driver/Hibernate detect the dialect unless a real compatibility reason requires an override. Configure pool sizing from workload and resource limits, not an arbitrary template.

Expose Actuator information/metrics only as required and protect them through the application's security and deployment network. Health details must not disclose credentials or internal exceptions.

## Migrations and Local Data

Use the existing migration system in every environment. On an empty database, migrations create the schema before JPA validation. Do not add a second schema in Docker entrypoint SQL. Database/user provisioning may be separate, but table ownership must remain unambiguous.

Keep development seeds identifiable and outside the normal production path. Never rewrite applied/shared migrations. Verify both empty initialization and upgrades of existing data for migration changes.

## API Contracts

Keep controllers thin and API DTOs distinct from persistence entities. Apply validation matching actual constraints, including nullable/unset semantics. Do not turn an example number, prefix, or field into a product requirement.

Preserve the established error response contract. For a new API, Spring ProblemDetail is an option; use stable domain codes and sanitized messages. Do not expose exception traces, SQL, or arbitrary exception messages.

Document the actual authentication scheme in OpenAPI rather than automatically declaring bearer JWT. Select springdoc 3.x for Boot 4 and 2.x for Boot 3, verifying the specific compatibility matrix. Keep generated/documentation endpoints protected or intentionally exposed according to the project's policy.

## Integration Tests

Use Boot-compatible test starters and the project's isolated test database. Testcontainers can provide a matching real database when selected; use current module names and Boot service connections or existing DynamicPropertySource conventions. Avoid a second embedded database whose behavior diverges from the supported dialect.

Real HTTP integration tests use an isolated profile and random server port. Verify contract, validation, authorization, and domain failures for affected endpoints. Unit/slice tests complement HTTP tests; choose the relevant surface rather than copying every test annotation from another Boot major.

## Sources

- [Externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)
- [Database initialization](https://docs.spring.io/spring-boot/how-to/data-initialization.html)
- [Testing](https://docs.spring.io/spring-boot/reference/testing/)
- [springdoc](https://springdoc.org/)
