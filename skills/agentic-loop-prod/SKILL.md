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

Inherit the persistent-development-branch invariant from the dev and staging
loops. Never create a release, hotfix, feature, fix, or task branch. Production
promotion must use only the persistent staging and production branches declared
by the project; every source correction returns through the persistent
development branch and repeats the invalidated dev and staging gates.

## Staging prerequisite

Require a current `STAGING_READY` report and candidate manifest for the exact
scope and revision set. If it is missing or stale, first run the complete dev and
staging loops under the explicit production-qualified request; production remains
blocked until staging is green. Re-run affected earlier gates after every source,
base, migration, configuration, or manifest change.

Confirm that the production candidate is exactly the staging-proven manifest.
Review diffs, secrets, generated files, migrations, target-only changes, and
rollback readiness before promotion.

## Operational configuration gate

For every in-scope operator-adjustable setting, require staging evidence for the
complete persistence, authenticated API, back-office UI, authorization, effective
readback, and restart-survival journey. In production, verify the deployed control
surface and effective value through production-safe reads. Perform a write-and-
restore check only when project policy explicitly permits it and the change is
safe; otherwise rely on the exact staging-proven write path plus production
readback.

Do not use a shell edit, direct database write, environment change, or restart as
the normal production control path. For approved infrastructure secrets,
bootstrap defaults, emergency overrides, and startup settings, verify documented
precedence and ensure operators can distinguish configured, effective, overridden,
and restart-pending state without exposing secrets.

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

Carry forward the staging-proven Manual Acceptance Ledger for the exact manifest
and add a production-safety classification to every row: `PRODUCTION_SAFE`,
`STAGING_ONLY`, `HUMAN_ONLY`, or `EXTERNAL_BLOCKED`. Exercise every required
`PRODUCTION_SAFE` row through production's real public interface and real
deployed dependencies, using dedicated ephemeral identities/data and the
project's approved safety limits. Do not count network interception, stub servers,
synthetic responses, in-memory substitutes, or mocked providers as real evidence
for the replaced boundary.

Reuse safe executable real-journey coverage against production rather than
replacing it with an ad hoc checklist. Never interpret this gate as authority for
an unsafe write. A `STAGING_ONLY` write may rely on the exact staging-proven path
plus production readback only when project policy explicitly defines that
substitution; otherwise the required row remains red. Preserve `HUMAN_ONLY` and
`EXTERNAL_BLOCKED` rows as honest limitations rather than inferred evidence.

Do not transfer the first production-safe acceptance pass to the user. Deliver
manual steps only as replay guidance after every production-executable row has
an agent-recorded result. If a new replay step first appears during production
verification or handoff preparation, invalidate the verification claim, add the
row at the source, and repeat every affected dev, staging, and production gate.

Carry forward the staging-proven Capability Preservation Ledger. Production
verification must prove the compliant replacement on the exact manifest for
every `PRODUCTION_SAFE` capability; the disappearance of the unsafe
representation is necessary but never sufficient. Do not resurrect an unsafe
surface or reclassify an unsafe action to obtain parity. A missing replacement
or an unapproved decommission decision invalidates `PROD_VERIFIED` and returns
through the authorized dev and staging flow.

For each journey, record identity/role, entry point, client/browser and viewport,
deployed revisions, visible behavior, persistence/readback, created identifiers,
and verified cleanup. Include relevant authorization, validation, loading/empty/
error/retry, accessibility, responsive, job, and provider paths. A skipped test
is not green. Never turn an unsafe production write into an implicit experiment.

### Pre-PROD_VERIFIED self-challenge

Run the pre-handoff challenge again against the exact production manifest. This
gate does not expand production authority or make an unsafe action safe:

1. Draft the complete manual production verification and recovery answer you
   would give the user, including manifest proof, health/log/migration checks,
   roles and production-safe journeys, permissions, readback, browser/client
   coverage, observability, cleanup, rollback readiness, and limitations.
2. Map every instruction to the carried ledger, its production-safety class,
   and one agent-recorded result for the exact production revision. Staging
   evidence alone is not production evidence unless project policy explicitly
   defines that substitution for a `STAGING_ONLY` action.
3. Ask of every unmatched or partial instruction: “Why did I not run this E2E
   in production?” If the row is `PRODUCTION_SAFE`, in scope, explicitly
   authorized, and executable, invalidate verification and execute it through
   the real public or operational path. If it changes source or manifest,
   return through dev and staging before promoting again.
4. Never execute or reclassify a destructive, user-impacting, or otherwise
   unsafe action merely to satisfy the question. Preserve it as `STAGING_ONLY`,
   `HUMAN_ONLY`, or `EXTERNAL_BLOCKED`; if the requirement cannot be proven
   under approved policy, the production gate remains red.
5. Repeat until no authorized `PRODUCTION_SAFE` instruction lacks evidence.
   Only then deliver manual guidance as replay plus explicit limitations.

If the user asks this question after `PROD_VERIFIED` and reveals a safe missing
step, invalidate the claim and repeat every affected dev, staging, and
production gate. Do not narrow the guide or infer new production permission.

## Production terminal

After independent coverage and adversarial review passes, update iteration/fix
records and affected delivery documentation through the verified repository flow.
Report commits, artifacts, pipeline runs, deployed revision proof, health/log/
migration evidence, real journey results, cleanup, rollback status, and honest
limitations.

Use this matrix:

| Requirement | Ledger row | Class | Production safety | Surface | Status | Local evidence | Staging evidence | Production evidence | Cleanup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Declare `PROD_VERIFIED` only when 100% of the required `PRODUCTION_SAFE` rows and
every other required row are complete and the production self-challenge is dry.
Never close an issue or stop shared infrastructure unless repository policy and
the user's scope explicitly require it.

## Blockers

Treat recoverable build, release, and test failures as loop inputs. Stop only for
missing authority or secrets, unavailable required external systems, a scope-
changing product/delivery decision, absent delivery infrastructure, or an
unrecoverable platform state. Report the exact reached state and evidence.
