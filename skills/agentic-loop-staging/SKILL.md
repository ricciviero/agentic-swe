---
name: agentic-loop-staging
description: Promote a DEV_READY candidate through a repository's verified pre-production delivery path, exercise it through real deployed interfaces, iterate fixes at the source, and stop at STAGING_READY without production changes. Use only when the user explicitly says "agentic loop staging" or "agentic-loop-staging", or explicitly asks to deliver and verify work in staging while withholding production.
---

# Agentic Loop Staging

## Contract

Extend `agentic-loop-dev` from a current `DEV_READY` candidate through the
repository's real pre-production environment. Continue across recoverable source,
pipeline, deployment, and test failures until the named scope has real deployed
evidence. End at `STAGING_READY` and stop before every production mutation.

An explicit staging request authorizes only the verified source-delivery and
pre-production actions allowed by repository and host policy. It never authorizes
production, bypassing protection, force-pushing, inventing credentials, or
changing unrelated work.

## Required routing

Read and apply `agentic-loop-dev`, the repository's configured planning workflow,
`skill-creator` when the project staging contract is missing or stale, and the
smallest relevant release, runtime, cloud, notification, test, and commit skills.
Use the project-specific staging skill as the operational source of truth.

Before mutation, inspect instructions, `.agentic/config.yaml`, remotes, dirty
state, branch protection, CI/CD, migration and seed policy, deployed-test config,
health/log/revision checks, rollback, test identities, cleanup, and environment
ownership. Never assume environment names, branch names, GitHub Actions, Docker,
AWS, URLs, or a promotion topology.

If the staging flow is real but undocumented, verify it read-only and create the
project skill first. If it is absent, materially undecided, or unverifiable with
available authority, stop before the first dependent mutation.

## Candidate manifest and production deny

Freeze a candidate manifest before delivery. For every deployable component,
record repository, source branch and SHA, target branch or artifact, required
migrations, expected environment, and validation rows. Reconcile the manifest
after every source fix; never test a mixture of old and new revisions as one
candidate.

Record the production boundary from evidence: production branches/artifacts,
workflows, accounts, hosts, URLs, secrets, and shared infrastructure. During this
loop, do not push or merge production branches, dispatch production workflows,
deploy production artifacts, run production migrations, mutate production data,
or run write tests against production. Recheck these invariants before reporting
`STAGING_READY`.

## State machine

```text
AGENTIC_LOOP_DEV -> DEV_READY -> SOURCE_DELIVERY -> STAGING_DELIVERY
       ^                    |              |                |
       +------ fix at source and re-prove locally ----------+

STAGING_DELIVERY -> STAGING_REAL -> DOCS/EVIDENCE -> STAGING_READY -> STOP
          ^               |
          +-- failure ----+
```

Do not patch only the target branch, running host, or staging database to make a
failure disappear. Diagnose from deployed evidence, fix at the verified source,
rerun affected local gates, create a new manifest, and promote again.

## Source and staging delivery

Require fresh `DEV_READY` evidence for the exact candidate. Review diffs,
secrets, unrelated changes, generated files, migrations, and operational records.
Commit and push only when the explicit request and project policy authorize them;
use the verified non-forced path and satisfy protected-branch checks.

Promote the complete manifest through the actual pipeline. Wait for observable
terminal success, then prove each deployed revision or artifact. For a multi-
repository release, run a final reconciliation deployment when the project flow
requires one so the environment cannot remain on a mixed manifest. Verify health,
migrations, post-deploy actions, container/process state, and relevant logs.

## Real deployed gate

Build a fixed ledger of in-scope user journeys. Every critical journey and the
project-required majority of the rest must be exercised through staging's real
public interface and real deployed dependencies. Network interception, stub
servers, synthetic responses, in-memory substitutes, and mocked providers remain
supplementary evidence and do not count as real for the replaced boundary.

For each applicable journey, capture:

- public entry point, identity/role, browser or client, viewport/input mode;
- deployed component revisions and real integration boundaries;
- action, visible result, persistence, and downstream readback;
- authorization, validation, empty/loading/error/retry, accessibility, and responsive states;
- created identifiers, cleanup action, and cleanup verification.

Use dedicated staging identities and collision-resistant markers. Respect shared-
environment concurrency and sandbox limits. A successful request, pipeline, or
health endpoint alone does not prove user behavior. A skipped test is not green.

## Staging terminal

Only after two independent review passes—coverage mapping and adversarial
inspection—update iteration/fix records and affected delivery documentation.
Report the exact candidate manifest, pipeline runs, revision proof, health/log/
migration evidence, real journey results, artifacts, cleanup, and limitations.

Use this matrix:

| Requirement | Surface | Status | Local evidence | Staging evidence | Cleanup |
| --- | --- | --- | --- | --- | --- |

Declare `STAGING_READY` only when every required row is complete and production
invariants are unchanged. Then stop. Production requires a separate explicit
production-qualified request and `agentic-loop-prod`.

## Blockers

Treat recoverable build, delivery, and test failures as loop inputs. Stop only
for missing authority or secrets, unavailable required external systems, a
scope-changing product/delivery decision, absent staging infrastructure, or an
unrecoverable platform state. Report the exact reached state and evidence.
