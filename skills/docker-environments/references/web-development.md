# Web Services in Local Docker

## Resolve the Stack

Read actual manifests and build wrappers. Match Java, Node, package manager, framework, database, service paths, and ports to the selected project versions. Do not impose a sample database/provider or copy old Node 20/Java 21 tags into a project using another compatibility set.

One compatible stack snapshot on 2026-10-08 was Java 25 with Boot 4.1 and Angular 22 with Node 24.15+ and TypeScript 6.0. These are examples; verify requirements before generating Dockerfiles. Native mobile builds use their own toolchains; Linux Docker does not supply Xcode or an iOS simulator.

## Spring Boot Hot Reload

A source bind mount plus spring-boot:run/bootRun does not automatically recompile changed Java sources. A working development setup needs both:

1. A compilation trigger, such as the selected IDE/watch process invoking the project's Maven/Gradle wrapper when sources/resources change.
2. DevTools restart observing the updated classpath/classes.

Make both owners explicit. Do not claim hot reload from a bind mount alone or use a watcher that monitors only a subset of relevant files. Keep app/watch process shutdown coordinated and preserve the last working application after a compile error. Use development-only DevTools; omit it from production artifacts.

Cache Maven/Gradle dependencies separately from mounted source. Avoid sharing host-generated architecture-specific build artifacts with a container without validating compatibility.

## Angular and Other Static Frontends

In development, bind the dev server to the intended container interface and publish only the needed local port. Mount source and keep node_modules container-owned to avoid macOS/Linux or ARM/x86 native dependency conflicts. Use polling only when the filesystem/watch environment needs it.

In production, build Angular with the selected Node toolchain in a builder stage and serve the resulting static files from a suitable web server. A browser-only admin SPA does not require Node or ng serve in the runtime image. Configure client-route fallback and the intended API proxy. Add SSR only when the application actually needs it.

## Addressing and Configuration

- A backend reaches a database by the Compose service name on the internal network.
- Browser code and mobile devices need an API endpoint reachable from their own environment; Docker service names are not public DNS names.
- A relative /api endpoint behind the intended proxy can simplify browser configuration. A physical mobile device usually needs a reachable host/domain address.
- Frontend public environment values become part of its delivered configuration; never place backend secrets there.
- Compose interpolation and container environment injection are separate mechanisms. Use --env-file for the selected interpolation file and env_file/environment for the intended container values.

## Database Startup

Use the project's migrations to create/upgrade tables. Initialization scripts may provision database/user prerequisites but must not compete with Flyway/Liquibase schema ownership. Keep seeds development-only unless the data is genuinely required in production.

Use healthcheck plus service_healthy where a dependent process must await readiness. service_started establishes startup order only. Application reconnection/retry behavior still needs to handle later dependency failures.

## Sources

- [Spring DevTools recompilation](https://docs.spring.io/spring-boot/reference/using/devtools.html)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/)
- [Compose interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
