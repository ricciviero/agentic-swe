# Docker on AWS

Use this guide when a Dockerized app must run in AWS production while preserving dev-to-prod consistency.

## Baseline

1. Build a production image with a pinned base and deterministic install.
2. Push to ECR.
3. Define ECS task definition or equivalent runtime config.
4. Inject environment config through Secrets Manager or Parameter Store.
5. Send logs to CloudWatch.
6. Run behind ALB or another managed entry point.
7. Keep the same image across environments; vary configuration by environment.

## Production Dockerfile Rules

- Use multi-stage builds where useful.
- Run as non-root.
- Do not bake secrets into layers.
- Expose only the application port.
- Add a health endpoint and container health check when supported.

## ECS Mapping

| Docker Compose concept | ECS/Fargate concept |
|---|---|
| service | ECS service |
| image | ECR image |
| env_file | task definition secrets/environment |
| ports | target group + ALB listener |
| volumes | EFS or ephemeral storage |
| restart | service desired count |
| logs | CloudWatch log group |

## Verification

- Image exists in ECR.
- Task starts in private subnet.
- ALB target group becomes healthy.
- Logs appear in CloudWatch.
- Secrets are not visible in image history or repository text.
