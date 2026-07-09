---
name: dotnet-backend
description: Senior-level .NET and C# backend development with ASP.NET Core Minimal APIs, EF Core, and Vertical Slice Architecture. Use for .NET, ASP.NET Core, C#, Minimal APIs, controllers, EF Core, DbContext, LINQ, Dapper, Identity, JWT, FluentValidation, OpenAPI, MediatR, Mapperly, resilience, Serilog, OpenTelemetry, xUnit, Testcontainers, .NET Aspire, SignalR, gRPC, Worker Services, or server-side Blazor work.
---

# .NET Backend

Build production ASP.NET Core services around the existing repository conventions. Prefer clear vertical slices over layered abstractions that add no value.

## First Pass

Inspect the solution, `.csproj` files, `Program.cs`, configuration, persistence, authentication, tests, and existing feature patterns before editing. Follow the installed .NET and package versions rather than assuming APIs.

## Architecture

- Prefer Vertical Slice Architecture: keep an endpoint, request/response contracts, validation, handler, mapping, and tests close to one feature.
- Use Minimal APIs by default. Use MVC controllers only when the existing project or a concrete binding requirement justifies them.
- Keep domain rules out of HTTP endpoints and persistence mapping.
- Use MediatR only when command/query dispatch or pipeline behavior has clear value; do not introduce it as ceremony.
- Use Mapperly or direct explicit mapping. Do not leak EF entities through public API contracts.

## API and Validation

- Group endpoints by feature and use typed results or explicit response contracts.
- Document public endpoints with OpenAPI and preserve existing versioning and authorization conventions.
- Validate every external input server-side. Use FluentValidation for non-trivial rules and return stable problem details.
- Return correct status codes and never expose stack traces, persistence errors, or secrets.

## Data

- Treat `DbContext` as the EF Core unit of work; do not wrap it in generic repository abstractions without a real boundary.
- Make nullability, indexes, constraints, concurrency, and ownership explicit.
- Use migrations for every schema change. Never alter an applied migration in shared environments.
- Use Dapper for focused read-heavy or SQL-specific paths only when it improves on EF Core.
- Make transactions explicit for multi-step writes and design idempotency where retries are possible.

## Security and Configuration

- Read the existing auth and policy setup before adding protected routes.
- Use established Identity, OpenID Connect, JWT, or external-provider patterns; do not create ad hoc authentication.
- Keep secrets outside source control and bind configuration through options with validation.
- Apply authorization at the endpoint or feature boundary, not only in the UI.

## Reliability and Observability

- Use structured logging with stable event names and properties. Do not use `Console.WriteLine` in production paths.
- Add health checks, metrics, tracing, and correlation consistent with the host service.
- Configure resilience only for real remote boundaries: timeout, retry with jitter, circuit breaking, and concurrency limits must match service behavior.
- Treat retries of non-idempotent operations as a design decision, not a default.

## Testing and Delivery

- Add unit tests for behavior with isolated dependencies.
- Add integration tests for real HTTP, persistence, authorization, validation, and error paths when the changed surface needs them.
- Use `WebApplicationFactory` and Testcontainers when they match the existing test strategy.
- Run the targeted test suite, formatting, analyzers, and build before reporting completion.

## Do Not

- Put business logic in endpoint lambdas, controllers, or EF mapping classes.
- Return entities directly from APIs.
- Disable validation, authorization, migrations, analyzers, or failing tests to ship a change.
- Add generic repositories, catch-all exception handling, or broad retry policies without a demonstrated need.
