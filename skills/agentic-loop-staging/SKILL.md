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

Inherit the persistent-development-branch invariant from `agentic-loop-dev`.
Never create a feature/fix/task branch for delivery or for a correction found in
staging. Promote only from the persistent source branch declared by the project
to its declared staging target. If either branch or mapping is missing or
ambiguous, stop before source mutation instead of inventing a branch.

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

## Operational configuration gate

For every in-scope operator-adjustable setting, prove the normal staging journey
through the authenticated API and the real back-office UI. Use a representative
authorized role to change the value, observe validation and confirmation, read
the effective state, and verify persistence across the relevant process restart
or redeployment. Verify that an unauthorized identity cannot change it and that
masked secrets are not disclosed.

Shell edits, direct database writes, deployment-variable changes, and restarts do
not prove the normal operator journey. If an environment value is intentionally
an infrastructure secret, bootstrap default, emergency override, or startup
setting, verify its documented precedence and that effective-state readback makes
any active override or restart requirement clear. Restore staging configuration
and test data when the project requires cleanup.

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
use the verified non-forced path from the persistent development branch and
satisfy protected-branch checks. Fixes discovered during staging return to that
same persistent branch; do not open a task-specific branch.

Promote the complete manifest through the actual pipeline. Wait for observable
terminal success, then prove each deployed revision or artifact. For a multi-
repository release, run a final reconciliation deployment when the project flow
requires one so the environment cannot remain on a mixed manifest. Verify health,
migrations, post-deploy actions, container/process state, and relevant logs.

## Real deployed gate

Carry forward the dev loop's fixed Manual Acceptance Ledger and bind it to the
exact deployed candidate manifest. Every required `AUTOMATABLE` and
`AGENT_EXECUTABLE` row, including every critical journey, must be exercised
through staging's real public interface and real deployed dependencies. A local
pass does not substitute for staging evidence. Network interception, stub
servers, synthetic responses, in-memory substitutes, and mocked providers remain
supplementary evidence and do not count as real for the replaced boundary.

Reuse the executable real-journey coverage from dev against staging whenever the
environment supports it; do not replace repeatable automation with an ad hoc
manual check. Preserve `HUMAN_ONLY` and `EXTERNAL_BLOCKED` classifications as
explicit limitations unless staging evidence genuinely changes them. If a new
replay step first appears during staging or handoff preparation, add it to the
source ledger, implement the missing coverage on the persistent development
branch, re-prove invalidated dev gates, create a new manifest, and redeploy.

Carry forward the dev Capability Preservation Ledger without changing its
denominator. For every affected capability, staging must prove the compliant
replacement—not merely the absence of the prior unsafe surface—through the real
public path on the exact deployed manifest. A missing replacement or an
unapproved decommission decision invalidates both `DEV_READY` and
`STAGING_READY`; fix it at the source, freeze a new candidate, and redeploy.

Do not transfer the first deployed acceptance pass to the user. Deliver a manual
checklist only as replay guidance after every staging-executable row has an
agent-recorded result. A skipped, blocked, or partially exercised required row
keeps the staging gate red.

### Pre-STAGING_READY self-challenge

Run the dev loop's pre-handoff challenge again against the exact deployed
manifest before `STAGING_READY`; local evidence cannot answer it for staging:

1. Draft the complete manual staging validation answer you would give the user,
   including manifest/revision proof, roles and identities, positive and
   negative journeys, permissions, writes and downstream readback, failure and
   retry states, relevant browsers/viewports/input modes, operational checks,
   cleanup, and proof that production remained unchanged.
2. Map every instruction to one fixed ledger row and one agent-recorded staging
   result for the exact live candidate. Nearby local evidence, a health check,
   or a successful pipeline is not a match.
3. Ask of each unmatched or partial instruction: “Why did I not run this E2E on
   staging?” If it is safe, in scope, authorized, and staging-executable,
   invalidate readiness, add the row at the source, implement durable coverage,
   rerun invalidated dev gates, freeze a new manifest, redeploy, and execute it.
4. Do not get green by shortening the guide, weakening the denominator, or
   relabeling a safe step as human. Repeat until a complete pass is dry.
5. Deliver the guide only as replay of already executed staging journeys;
   identify `HUMAN_ONLY` and `EXTERNAL_BLOCKED` limits separately. A required
   blocked row remains red.

Staging coverage is complete only when 100% of the in-scope `AUTOMATABLE` and
`AGENT_EXECUTABLE` rows have matching evidence on the exact deployed manifest.
If the user asks the challenge question after a readiness claim and exposes a
safe missing step, reopen the source ledger and every invalidated terminal.

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

| Requirement | Ledger row | Class | Surface | Status | Local evidence | Staging evidence | Cleanup |
| --- | --- | --- | --- | --- | --- | --- | --- |

Declare `STAGING_READY` only when 100% of the in-scope executable rows and every
other required row are complete, the self-challenge is dry, and production
invariants are unchanged. Then stop. Production requires a separate explicit
production-qualified request and `agentic-loop-prod`.

## Blockers

Treat recoverable build, delivery, and test failures as loop inputs. Stop only
for missing authority or secrets, unavailable required external systems, a
scope-changing product/delivery decision, absent staging infrastructure, or an
unrecoverable platform state. Report the exact reached state and evidence.
