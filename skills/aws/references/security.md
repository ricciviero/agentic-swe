# Security

## IAM

- Prefer roles over users with access keys.
- Scope policies to required actions and resources.
- Use permission boundaries for automation roles when appropriate.
- Separate dev/staging/prod accounts or environments.

## Platform Controls

- Enable CloudTrail.
- Consider GuardDuty for threat detection.
- Use KMS for encryption needs beyond service defaults.
- Put WAF in front of internet-facing HTTP workloads when risk justifies it.
- Enforce IMDSv2 on EC2.

## Verification

- No long-lived credentials in repo or workflow config.
- Public access blocks are enabled on S3 unless public read is intentional.
- Security groups expose only intended ports.
- Production mutation paths require human approval.
