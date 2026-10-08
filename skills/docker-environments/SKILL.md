---
name: docker-environments
description: Configure or review Dockerfiles and Docker Compose for local development and production web services. Use for containerized frontend/backend/database environments, real hot reload, multistage builds, networking, secrets, readiness, and single-host deployment layouts. Determine the actual target before provider-specific work.
---

# Docker Environments Agent

Use this skill to dockerize, containerize, or configure Docker/Docker Compose for full-stack projects across dev and production.

## Load References

Inspect the project stack and the installed Docker and Compose versions before generating stack-specific Dockerfiles, Compose files, environment files, or startup scripts.

- For compiled backend hot reload and Angular/static frontend builds, read [web-development.md](references/web-development.md).
- For production images, Compose environment handling, persistence, and releases on one host, read [single-host-production.md](references/single-host-production.md).

Read only relevant references. A request to research Docker or understand a mockup does not authorize generating files or starting containers.

## First Questions

Always determine these before writing files:

- Project services and real folder names; never assume `frontend/` and `backend/`.
- Frontend/backend frameworks and package managers.
- Database type, ports, startup order, migrations, and seed needs.
- Target deploy: local only, private VPS/single server, or AWS.
- Whether hot reload is required in development.

If the target is AWS, generate AWS-ready container artifacts only where appropriate and delegate runtime/deploy choices to `$aws`.

Use information already supplied by the user; ask only for missing decisions that materially affect the requested files. A private host or an EC2 running Compose is a single-host deployment; do not silently replace it with ECS or a managed database. Keep undecided production choices explicit.

## Default Project Shape

Prefer this structure unless the repo already has a better convention:

- Root `docker-compose.yml` for development.
- Root `.env` for local Compose variables.
- `Dockerfile` and `Dockerfile.dev` per service, in each service folder.
- `.dockerignore` per service.
- Root `start.sh` for local startup with Docker checks and clean shutdown.
- `deploy/docker-compose.prod.yml` plus `.env.prod` placeholders for single-host production.

## Core Rules

- One container per app/service; do not build a monolithic all-in-one container.
- Cache dependencies before copying source code in every Dockerfile.
- Mount source code for local hot reload; production images copy built artifacts only.
- Keep secrets out of images. Use env files, orchestrator secrets, or deployment-specific secret stores.
- Log to stdout/stderr; do not rely on files inside containers for runtime logs.
- Reproduce empty databases through the project's canonical migration system. Separate development seeds from production data; init scripts must not duplicate migration-owned tables.
- Add health checks when service readiness matters.
- A dependency being started does not mean it is ready; use the appropriate readiness condition. Health status alone does not make Compose automatically restart an unhealthy running service.
- Validate requested configuration with `docker compose config`; for implementation work, exercise a real startup when authorized and feasible. Do not run an unrelated application to validate documentation changes.

## Delivery Checklist

- Compose service names, contexts, ports, volumes, and env vars match the actual repo.
- `.dockerignore` prevents `node_modules`, build outputs, caches, secrets, and VCS metadata from entering images.
- Dev and prod differences are explicit.
- Production files use placeholders for unknown secrets instead of invented values.
- Commands in the final answer match the generated files.
