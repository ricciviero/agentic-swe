# Production on a Single Docker Host

## Keep the Target Explicit

A private server/VPS and an EC2 running Docker Compose share a single-host orchestration pattern. ECS/Fargate or another managed runtime is a separate target. Do not choose a cloud, CPU architecture, managed database, or Kubernetes without a requirement. Compose on one host does not provide host-level high availability.

A deploy/ directory with production Compose/configuration can keep the host's orchestration separate from development. Follow the repository's established layout rather than requiring a second repository, branch policy, or deployment mechanism.

## Images and Networking

- Build optimized artifacts in multi-stage images. Keep compilers, dev servers, source bind mounts, and build secrets out of production runtime images.
- Use an appropriate maintained base image and supported CPU architectures. Alpine is a choice with libc/native-dependency implications, not a universal optimization.
- Run application processes as a non-root user where supported. Add relevant privilege/resource restrictions without breaking legitimate runtime writes or server behavior.
- Pin intentional image versions; immutable release tags/digests make deployments reviewable and repeatable. Avoid floating latest for production.
- Normally expose only the reverse proxy's public ports. Keep database and application service ports internal unless an explicit access requirement justifies exposure.
- Match HTTPS, proxy headers, routing, SPA fallback, and health endpoints to the actual application and deployment. The proxy/provider remains a project choice.

## Environment Files and Secrets

Compose's .env file supplies interpolation values; a service env_file injects values into that container. Naming a file .env.prod does not make Compose automatically use it for interpolation. An appropriate command for a layout containing those files is:

```sh
docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml config --quiet
```

Use commands matching the generated paths. Treat actual secret-bearing config output as sensitive; do not print rendered credentials into logs or reports. Keep secrets outside images/build context and Git. Use env files with suitable access restrictions, Compose/orchestrator secrets, or the chosen secret store.

Environment/deployment configuration covers infrastructure-managed startup values and emergency overrides. Product-managed settings require their normal persisted and authorized control surface rather than routine container edits.

## Persistence and Operations

Use durable volumes or a deliberately selected external data service. A volume is not a backup: define backups outside the host failure boundary, retention, and a restore procedure. Keep migration execution and development seeding unambiguous.

Configure relevant readiness, restart behavior, graceful shutdown, resource limits, and log rotation/collection. Compose healthcheck marks status; it does not independently restart an unhealthy running container. depends_on readiness controls initial startup and does not replace application recovery after a later outage.

## Releases

Prefer building versioned images in CI and promoting the tested image to the host when that workflow is selected. If builds happen on the host, account for build resources, dependency availability, and the exact source revision.

Do not overwrite a checkout's local changes with git reset --hard as an implicit deployment step. The release workflow must establish ownership, recovery, and user authorization before destructive synchronization.

Document the specific release and rollback commands. Application rollback and schema rollback differ: use migration compatibility/backups and an explicit recovery plan rather than assuming an old image can read every new schema. Serialize concurrent releases when needed.

## Validation

Validate Compose configuration without exposing secrets, build the affected images, and exercise the requested startup path when implementation scope permits it. Verify empty database initialization, persistence across restart, proxy/browser access, and relevant failure behavior. Do not deploy to production simply to validate a Dockerfile.

## Sources

- [Compose in production](https://docs.docker.com/compose/how-tos/production/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Environment interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
- [Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/)
- [Startup order](https://docs.docker.com/compose/how-tos/startup-order/)
