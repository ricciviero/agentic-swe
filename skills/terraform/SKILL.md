---
name: terraform
description: Safely design, validate, plan, import, apply, recover, and automate Terraform infrastructure. Use for Terraform HCL (`.tf`, `.tfvars`, `.tftest.hcl`), providers/modules/backends/state, brownfield imports, drift, lock/recovery, upgrades, and Terraform CI/CD on any cloud.
---

# Terraform

Treat state and saved plans as sensitive operational data. Prefer small roots, explicit ownership, reproducible provider locks, and a reviewed saved plan over ad-hoc CLI mutations.

## Discover before editing

1. Read repository instructions and the existing Terraform/runbook files.
2. Inspect `git status`, root/module boundaries, backend keys, lock files, and the installed CLI version.
3. Verify the active cloud identity and region before any refresh, plan, import, or apply.
4. Consult current official Terraform and provider documentation when syntax, import IDs, defaults, or versions may have changed.
5. Never source credentials from HCL, versioned tfvars, saved plans, or command arguments. Use the provider's standard credential chain and short-lived CI identity.

## Execute with gates

For each root, use this sequence:

```bash
terraform fmt -check
terraform init -input=false
terraform validate
terraform test -no-color          # only when tests are mocked/plan-only
terraform plan -input=false -out=review.tfplan
terraform show -json review.tfplan
```

Inspect JSON actions, replacement paths, unknown values, and sensitive output before applying. Apply the exact saved plan only after explicit authorization:

```bash
terraform apply -input=false review.tfplan
terraform plan -input=false -detailed-exitcode
```

Interpret `-detailed-exitcode` as `0=no diff`, `1=error`, `2=diff`. Never convert exit code `2` into an automatic apply.

Stop on unexpected delete/replace, identity mismatch, backend/lock failure, secret exposure, or a change outside the approved scope. Do not use `-auto-approve` or `terraform destroy` on production unless the user explicitly authorizes that exact destructive plan.

## Adopt brownfield infrastructure

1. Snapshot live identifiers and behavior outside Git.
2. Write the intended final resource/module address first.
3. Use versioned `import` blocks. Use `-generate-config-out` only as scratch material.
4. Import one lifecycle family at a time when risk is high.
5. Require `N to import, 0 to add, 0 to change, 0 to destroy` before applying imports.
6. Run a second plan after import and require `0/0/0`.
7. Put safe normalization such as tags in a separate reviewed in-place plan.

Importing is a state operation, not proof that configuration is faithful. Any post-import diff must be understood before continuing.

## Protect state

- Use a remote backend with encryption, versioning, public access blocked, and least-privilege access.
- For S3 backends, prefer `use_lockfile = true`; DynamoDB locking is deprecated.
- Separate state by environment and lifecycle boundary. Avoid a monolithic multi-client state.
- Commit `.terraform.lock.hcl`; never commit `.terraform/`, state, plan binaries, crash logs, or secret tfvars.
- Before `force-unlock`, prove the lock is orphaned and no other Terraform process is active.
- Recover by preserving the current object, selecting a known-good version, and verifying `state pull` plus a zero-change plan.

## Build modules and CI

- Pin Terraform compatibility and provider major versions; let the lock file select the reviewed patch.
- Validate inputs and expose minimal outputs. Avoid provisioners for OS or application configuration.
- Use `terraform test` with mock providers and `command = plan` for invariants; do not run test applies against a live account.
- Authenticate CI with OIDC and an exact repository/branch or protected-environment subject.
- Give plan jobs read permissions plus only the state-lock writes they require. Keep apply in a separate protected role/workflow.
- Do not upload plan binaries or full plan output as public artifacts/comments.

## Verify end to end

After apply or import, verify:

- every managed root plans with no diff;
- remote state is readable and versioned;
- locking works and leaves no orphan lock;
- live service identity, network endpoints, monitoring, and audit behavior are unchanged unless explicitly planned;
- Git contains no state, plan, `.terraform/`, credentials, or generated secrets;
- runbooks and architecture documentation match HCL, state, and live infrastructure.
