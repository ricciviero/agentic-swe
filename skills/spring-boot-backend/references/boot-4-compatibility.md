# Spring Boot 4 Compatibility

## Inspect the Actual Version Set

Read the build wrapper, Boot parent/plugin/BOM, compiler/toolchain target, and dependency overrides. Check the matching official requirements and release notes before a new scaffold or upgrade. Existing Boot 3 applications retain their version unless an upgrade is requested.

Snapshot verified on 2026-10-08: Boot 4.1.1 was stable, required Java 17+, and documented compatibility through Java 26; Java 25 LTS was therefore compatible. Maven 3.6.3+ and Gradle 8.14+ in the 8.x line or 9.x were supported. Recheck current patch releases and tool support when implementing.

Use a maintained JDK distribution such as Eclipse Temurin where appropriate. Align compilation, local/container runtime, and CI Java versions. An Android app may require a different JDK for its build; backend Java selection does not apply to Android Gradle.

## Managed Dependencies and Changed APIs

- Let Boot manage Spring Framework, Security, Data, Hibernate, Jackson, and testing dependencies unless a documented compatibility requirement calls for an override.
- Boot 4 uses Spring Framework 7 and Jackson 3 by default. Verify changed imports, mapper/module integration, and any third-party library that expects Jackson 2. Do not add a Jackson 2 compatibility layer merely because an old snippet uses ObjectMapper.
- Use Jakarta packages and the servlet/container level supported by the selected Boot version. Generate compatible starters from Initializr or the matching documentation; Boot 4 has more modular starters/test support.
- Boot 4 uses JUnit 6/Jupiter. Select the matching Boot test starters and current mock-bean/test annotations rather than independently pinning an older JUnit platform or copying obsolete test imports.
- springdoc 3.x targets Boot 4; springdoc 2.x targets Boot 3. Verify the current patch and documented matrix, including JSON integration. Do not reuse a hardcoded springdoc 2.3.0 dependency in a Boot 4 scaffold.
- Select Testcontainers/Flyway database modules compatible with the Boot-managed versions and actual database. Verify artifact names/imports for the chosen major instead of copying an old template.

## Runtime and Delivery

Choose MVC or reactive APIs according to the application, not the newest tutorial. Virtual threads, native images, preview language features, and additional infrastructure are independent decisions requiring a concrete benefit.

Use schema migrations as the authority, explicit production configuration, and readiness appropriate to actual dependencies. Do not enable DevTools in production. Test the real serialization, validation, authentication, migration, and HTTP boundaries affected by an upgrade.

## Official Sources

- [System requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [Spring Initializr](https://start.spring.io/)
- [Boot release notes](https://github.com/spring-projects/spring-boot/wiki)
- [JSON integration](https://docs.spring.io/spring-boot/reference/features/json.html)
- [Testing](https://docs.spring.io/spring-boot/reference/testing/)
- [springdoc compatibility](https://springdoc.org/)
- [Temurin container images](https://adoptium.net/en-GB/installation/containers)
