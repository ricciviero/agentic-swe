# Infrastructure as Code

Use IaC for staging and production infrastructure. Console-only production changes create drift.

## Tool Selection

- AWS CDK: AWS-only projects that benefit from a programming language.
- CloudFormation: direct AWS-native templates.
- SAM: serverless-first projects.
- Terraform/OpenTofu: multi-cloud or organization-standard IaC.
- Pulumi: programming-language IaC when already adopted.

## Workflow

1. Model resources in IaC.
2. Run formatting and validation.
3. Generate a diff or plan.
4. Estimate cost impact.
5. Ask before production apply.
6. Store state securely and restrict access.

## Verification

```bash
cdk diff
terraform plan
aws cloudformation validate-template --template-body file://template.yaml
```

Use drift detection periodically and after emergency console changes.
