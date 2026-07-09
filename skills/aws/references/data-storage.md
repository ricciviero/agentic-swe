# Data and Storage

## Service Choices

- RDS/Aurora: relational workloads, transactions, SQL constraints.
- Aurora Serverless v2: relational workloads with variable traffic.
- DynamoDB: known access patterns, high throughput, key/value or document shape.
- ElastiCache Valkey: cache, rate limiting, ephemeral shared state.
- S3: object storage and static assets.
- EFS: shared POSIX filesystem for workloads that truly need it.

## Rules

- Keep databases private.
- Enable backups and point-in-time recovery where available.
- Use encryption at rest.
- Use least-privilege IAM or DB users.
- Add indexes based on access patterns.
- Test restore, not just backup creation.

## Avoid

- Public RDS or Redis/Valkey.
- DynamoDB without known partition/sort key access patterns.
- S3 buckets with public write or broad public read unless explicitly intended.
