# AWS CLI and Agent Guardrails

Use AWS CLI v2 with IAM Identity Center (SSO) for humans and read-only-by-default guardrails for agentic workflows.

## Human Access

```bash
aws configure sso
aws sso login --sso-session <session-name>
aws sts get-caller-identity --profile <profile>
```

SSO credentials live in the local AWS cache and expire. Do not commit credentials or profile files containing private account details.

## Agent Guardrails

- Start with read-only commands: `describe-*`, `get-*`, `list-*`, and CloudWatch log reads.
- Require human confirmation for all mutations: `create-*`, `update-*`, `put-*`, `delete-*`, `terminate-*`.
- Never auto-approve destructive commands.
- Confirm account, region, and profile before any mutation.
- Record commands and outputs relevant to the task.

## MCP / Tooling Notes

If an AWS MCP server is used, keep permissions scoped and prefer read-only mode until the user explicitly asks for changes. Store project workflow guidance in `AGENTS.md`; do not put credentials there.
