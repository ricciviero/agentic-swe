# Secrets and Config

Use AWS managed services and IAM roles for secrets and runtime configuration.

## Choices

- Secrets Manager: secrets needing rotation, lifecycle, or richer management.
- SSM Parameter Store SecureString: simpler encrypted configuration.
- Environment variables: non-secret config only.
- IAM roles: service-to-service AWS access; avoid static keys.

## Rules

- Do not commit secrets.
- Do not bake secrets into Docker images.
- Inject secrets at runtime.
- Grant services access only to the parameters/secrets they need.
- Rotate credentials with overlap: create new, deploy clients, disable old, verify, delete old.

## Verification

- No secrets in repository text or image history.
- Runtime task/function role can read required secrets and no unrelated secrets.
- App starts without printing secret values.
