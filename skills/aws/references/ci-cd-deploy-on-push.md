# CI/CD Deploy on Push

Prefer GitHub Actions with OIDC for AWS deployments. Do not store static AWS access keys in GitHub secrets when OIDC is available.

## GitHub OIDC Baseline

```yaml
permissions:
  id-token: write
  contents: read
```

Use `aws-actions/configure-aws-credentials` to assume a role scoped to the repository, branch, and environment.

## Deployment Flow

1. Run tests and build.
2. Build and push image or package artifact.
3. Validate IaC (`cdk diff`, `terraform plan`, or template validation).
4. Deploy staging automatically.
5. Gate production with environment approvals when required.
6. Roll back on failed health checks or CloudWatch alarms.

## Safety

- One deploy per environment at a time.
- Branch/environment mapping is explicit.
- Production role cannot mutate unrelated infrastructure.
- Secrets stay in AWS managed services, not in workflow YAML.
- Use canary or blue/green where risk justifies it.

## Verification

- Workflow uses OIDC, not `AWS_ACCESS_KEY_ID`.
- The assumed role trust policy restricts repo, branch, and audience.
- Deployment emits artifact/image digest and environment URL.
- Rollback path is tested.
