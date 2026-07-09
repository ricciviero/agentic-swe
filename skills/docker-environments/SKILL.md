---
name: docker-environments
description: Docker and Docker Compose environment setup for full-stack projects. Use this skill whenever the user asks to dockerize, containerize, create docker-compose, set up dev/prod environments, or configure Docker for any combination of frontend, backend, and database. Trigger on any mention of Docker, Dockerfile, docker-compose, container, hot reload in Docker, multistage build, or dev/prod environment setup. Also trigger when the user mentions dockerizing an existing project or adding Docker support. Always ask for the deployment target (private server/VPS, AWS, or undecided). Produce AWS-ready artifacts only when the user chooses AWS, and delegate deployment/runtime decisions to the aws skill. When in doubt, use this skill for any Docker or Docker Compose task.
---

# Docker Environments Agent

Use this skill to dockerize, containerize, or configure Docker/Docker Compose for full-stack projects across dev and production.

## Load References

Inspect the project stack and the installed Docker and Compose versions before generating stack-specific Dockerfiles, Compose files, environment files, or startup scripts.

## First Questions

Always determine these before writing files:

- Project services and real folder names; never assume `frontend/` and `backend/`.
- Frontend/backend frameworks and package managers.
- Database type, ports, startup order, migrations, and seed needs.
- Target deploy: local only, private VPS/single server, or AWS.
- Whether hot reload is required in development.

If the target is AWS, generate AWS-ready container artifacts only where appropriate and delegate runtime/deploy choices to `$aws`.

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
- Make databases reproducible with init/migration/seed behavior suitable for the stack.
- Add health checks when service readiness matters.
- Validate with `docker compose config` and a real `docker compose up --build` when feasible.

## Delivery Checklist

- Compose service names, contexts, ports, volumes, and env vars match the actual repo.
- `.dockerignore` prevents `node_modules`, build outputs, caches, secrets, and VCS metadata from entering images.
- Dev and prod differences are explicit.
- Production files use placeholders for unknown secrets instead of invented values.
- Commands in the final answer match the generated files.
