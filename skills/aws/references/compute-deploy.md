# Compute and Deployment

## Decision Tree

- Static site or SPA: S3 + CloudFront + OAC.
- Next.js static export: S3 + CloudFront.
- Next.js SSR: Amplify Hosting, App Runner with container, ECS Fargate, or Lambda-based adapter when the project already supports it.
- Containerized HTTP backend: ECS Fargate behind ALB.
- Existing VM-style app or special host requirements: EC2 with systemd/PM2/Docker.
- Short event-driven jobs: Lambda.
- Long jobs or worker pools: ECS tasks, AWS Batch, or SQS-triggered workers.
- Kubernetes-native team/platform: EKS.

## ECS Fargate Baseline

- Build immutable Docker images and push to ECR.
- Run tasks in private subnets.
- Put ALB in public subnets.
- Use ECS Service Auto Scaling.
- Inject config from Secrets Manager or Parameter Store.
- Send logs to CloudWatch.
- Add health checks at ALB and container level.

## Static Frontend Baseline

- S3 bucket is private.
- CloudFront uses Origin Access Control.
- Use ACM certificate in `us-east-1` for CloudFront.
- Add cache behaviors for assets and HTML separately.
- Invalidate or version assets on deploy.

## Lambda Baseline

- Keep handlers small and explicit.
- Package dependencies reproducibly.
- Use reserved concurrency for safety where needed.
- Put functions in a VPC only when they need private resources.
- Use structured logs, alarms, and DLQs or destinations.

## Avoid

- EKS without Kubernetes operational maturity.
- Public databases or caches.
- Manually edited production infrastructure.
- Single-AZ production databases for systems that must stay available.
