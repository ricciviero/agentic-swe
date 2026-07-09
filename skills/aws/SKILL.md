---
name: aws
description: Senior-level AWS cloud engineering for deploying and operating complex web applications. Use for compute choices (EC2, ECS/Fargate, EKS, Lambda, App Runner, Beanstalk, Lightsail), frontend hosting (S3 + CloudFront, Amplify), SSR Next.js, GitHub Actions OIDC or CodePipeline CI/CD, IaC with CDK, CloudFormation, SAM, Terraform/OpenTofu, Pulumi, VPC, databases, secrets, observability, IAM security, cost control, disaster recovery, AWS CLI, AWS SSO, and AWS MCP workflows.
---

# AWS

Design, deploy, and operate production web applications on AWS with repeatable deployments and low operational debt.

## Service Selection

Choose the highest managed level that satisfies real constraints:

- Static frontend or SPA: S3 + CloudFront with Origin Access Control.
- Container backend with steady traffic: ECS Fargate behind ALB with Service Auto Scaling.
- Bursty/event-driven backend: Lambda + API Gateway.
- Relational data: Aurora, including Serverless v2 for variable traffic.
- Known high-throughput key/value patterns: DynamoDB.
- Cache: ElastiCache Valkey.
- CI/CD: GitHub Actions + OIDC; no long-lived AWS keys.
- IaC: CDK for AWS-only projects, Terraform/OpenTofu for multi-cloud, SAM for pure serverless.
- EKS only when the team is already Kubernetes-first.

## Reference Routing

| File | Read when |
|---|---|
| [references/compute-deploy.md](references/compute-deploy.md) | Choosing runtime, frontend hosting, SSR Next.js, containers, or load balancing |
| [references/docker-on-aws.md](references/docker-on-aws.md) | Moving a Dockerized app to AWS production |
| [references/ci-cd-deploy-on-push.md](references/ci-cd-deploy-on-push.md) | Automating deployment on push |
| [references/infrastructure-as-code.md](references/infrastructure-as-code.md) | CDK, CloudFormation, SAM, Terraform/OpenTofu, Pulumi |
| [references/agent-access.md](references/agent-access.md) | AWS CLI/SSO and agent guardrails |
| [references/data-storage.md](references/data-storage.md) | RDS, Aurora, DynamoDB, ElastiCache, S3, EFS |
| [references/secrets-config.md](references/secrets-config.md) | Secrets Manager, Parameter Store, service roles |
| [references/networking.md](references/networking.md) | VPC, subnets, NAT, ALB, Route 53, ACM |
| [references/observability.md](references/observability.md) | CloudWatch logs, metrics, alarms, tracing |
| [references/security.md](references/security.md) | IAM least privilege, GuardDuty, WAF, Shield, KMS |
| [references/costs-reliability.md](references/costs-reliability.md) | Budgets, Savings Plans, autoscaling, DR |

## Non-Negotiables

1. No long-lived credentials in repositories, `.mcp.json`, `AGENTS.md`, or versioned environment files. Humans use IAM Identity Center (SSO) with MFA. CI uses OIDC.
2. Use least privilege. Prefer roles over users with keys. Use separate accounts or environments for dev/staging/prod.
3. Agent workflows start read-only. Mutations require explicit human confirmation. Destructive actions never auto-approve.
4. For infrastructure changes: prepare IaC, validate (`cdk diff`, `terraform plan`, template validation), estimate cost, then ask before applying production changes.
5. Staging and production infrastructure lives as versioned IaC. If emergency console changes are unavoidable, reconcile them back into IaC.
6. Production workloads that must stay up use at least two Availability Zones. Use per-AZ NAT Gateway for production.

## Typical Greenfield Flow

1. Understand workload type, traffic shape, latency/compliance needs, and statefulness.
2. Choose runtime and hosting.
3. Choose data services and cache.
4. Define VPC, subnets, DNS, TLS, and load balancing.
5. Manage secrets through AWS managed services and IAM roles.
6. Automate deploys with OIDC and rollback.
7. Add observability before production traffic.
8. Apply IAM, WAF/Shield, KMS, and Well-Architected checks.
9. Set budgets, autoscaling, and a DR plan based on RTO/RPO.

## Skill Integrations

- Use `iterations-planner` for complex deploy work and record rollback, alarms, cost estimate, secrets handling, and versioned IaC in `AGENTS.md` when the project tracks workflow docs.
- Use `docker-environments` to create the image before deploying it to ECS/Fargate.
- Backend and frontend skills own the app code; this skill owns where and how it runs in AWS.
