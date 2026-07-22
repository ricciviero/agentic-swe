---
name: agentic-loop-prod
description: Promote a current STAGING_READY candidate through a repository's verified production path and prove it through production-safe real evidence. Use only when the user explicitly says "agentic loop prod" or "agentic-loop-prod", or explicitly requests delivery and verification through production. Never infer production authorization from dev or staging work.
---

# Agentic Loop Prod

## Contract

Extend `agentic-loop-staging` from a current `STAGING_READY` candidate through
the repository's verified production delivery path. Continue across recoverable
release, deployment, and verification failures until the named scope has complete
production evidence.

Use only with an explicit production-qualified request. The request never grants
capabilities, bypasses branch protection, invents credentials, or expands scope;
repository policy, host controls, and user authority still apply.

## Required routing

Read and apply `agentic-loop-dev`, `agentic-loop-staging`, the target repository's
project staging and production skills, and the smallest relevant release,
runtime, cloud, notification, test, and commit skills. Use `agents-setup` when
the repository is unconfigured and `skill-creator` when verified durable delivery
knowledge is missing or stale.

Do not substitute this workflow for project-specific operational knowledge.
Before mutation, verify instructions, `.agentic/config.yaml`, remotes, dirty
state, branch protection, CI/CD, migration and seed policy, rollback, health,
logs, artifact identity, production-safe tests, cleanup, and environment ownership.

## Staging prerequisite

Require a current `STAGING_READY` report and candidate manifest for the exact
scope and revision set. If it is missing or stale, first run the complete dev and
staging loops under the explicit production-qualified request; production remains
blocked until staging is green. Re-run affected earlier gates after every source,
base, migration, configuration, or manifest change.

Confirm that the production candidate is exactly the staging-proven manifest.
Review diffs, secrets, generated files, migrations, target-only changes, and
rollback readiness before promotion.

## State machine

```text
AGENTIC_LOOP_STAGING -> STAGING_READY -> PRODUCTION_DELIVERY -> PRODUCTION_REAL
        ^                                      |                    |
        +-------- fix at source, re-run dev and staging ------------+

PRODUCTION_REAL -> DOCS/EVIDENCE -> PROD_VERIFIED -> STOP
```

Do not create a production-only hotfix path or patch a running host. On failure,
follow verified rollback policy when immediate safety requires it, then fix at
the source and repeat every invalidated dev, staging, and production gate.

## Production delivery

Promote the exact manifest through the project's real protected path. Wait for
observable terminal success and prove each deployed revision or artifact. For a
multi-repository release, require the project's reconciliation deployment so the
environment is not a mixed candidate.

Verify migrations, post-deploy actions, health, process/container state, relevant
logs, notification outcomes, and rollback viability. A green pipeline or health
endpoint alone does not prove the requirement.

## Production-safe real gate

Exercise every required journey through production's real public interface and
real deployed dependencies, using dedicated ephemeral identities/data and the
project's approved safety limits. Do not count network interception, stub servers,
synthetic responses, in-memory substitutes, or mocked providers as real evidence
for the replaced boundary.

For each journey, record identity/role, entry point, client/browser and viewport,
deployed revisions, visible behavior, persistence/readback, created identifiers,
and verified cleanup. Include relevant authorization, validation, loading/empty/
error/retry, accessibility, responsive, job, and provider paths. A skipped test
is not green. Never turn an unsafe production write into an implicit experiment.

## Production terminal

After independent coverage and adversarial review passes, update iteration/fix
records and affected delivery documentation through the verified repository flow.
Report commits, artifacts, pipeline runs, deployed revision proof, health/log/
migration evidence, real journey results, cleanup, rollback status, and honest
limitations.

Use this matrix:

| Requirement | Surface | Status | Local evidence | Staging evidence | Production evidence | Cleanup |
| --- | --- | --- | --- | --- | --- | --- |

Declare `PROD_VERIFIED` only when every required row is complete. Never close an
issue or stop shared infrastructure unless repository policy and the user's scope
explicitly require it.

## Blockers

Treat recoverable build, release, and test failures as loop inputs. Stop only for
missing authority or secrets, unavailable required external systems, a scope-
changing product/delivery decision, absent delivery infrastructure, or an
unrecoverable platform state. Report the exact reached state and evidence.
