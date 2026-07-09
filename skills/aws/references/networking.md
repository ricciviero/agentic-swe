# Networking

## Baseline VPC

- Public subnets: ALB, NAT Gateway, public entry points only.
- Private subnets: app tasks, databases, caches.
- Separate subnets across at least two Availability Zones for production.
- Route 53 for DNS and ACM for certificates.

## Rules

- Do not put databases or caches in public subnets.
- Security groups allow only required inbound paths.
- Prefer VPC endpoints for AWS service access when cost/security justifies it.
- Use one NAT Gateway per AZ for production resilience; lower environments may use simpler setups to save cost.

## Verification

- ALB is public only when intended.
- ECS/tasks and DBs have private IPs only.
- Security groups do not allow broad admin access.
- TLS certificate is valid and attached to the listener or CloudFront distribution.
