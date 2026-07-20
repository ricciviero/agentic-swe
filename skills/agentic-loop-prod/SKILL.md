---
name: agentic-loop-prod
description: Run a persistent, repository-aware engineering loop through verified production evidence. Use only when the user explicitly says "agentic loop prod" or "agentic-loop-prod", or explicitly requests the full investigate-to-production loop. First complete the real local dev loop, then discover and codify the repository's actual delivery topology before any remote mutation. Never assume branch names, CI/CD provider, staging, deployment commands, rollback, or environment URLs.
---

# Agentic Loop Prod

## Contract

Extend `agentic-loop-dev` from `DEV_READY` through the repository's real release
path and production verification. Continue across recoverable test, build, and
deployment failures until the named scope has complete production evidence.

Use only with an explicit production-qualified request. The request does not
grant permissions, override branch protection, invent credentials, or expand
scope. Effective actions remain bounded by repository policy, host controls, and
the user's authority.

## Required skills

Read and apply:

- `agentic-loop-dev` for the complete local loop;
- `agents-setup` when the target repository is unconfigured;
- `skill-creator` for required project delivery skills;
- the target repository's selected release, deployment, runtime, E2E, cloud, and notification skills;
- `git-commit` only when commit work is authorized and local gates are green.

Do not substitute this global workflow for repository-specific delivery
knowledge.

## Delivery discovery gate

Complete this gate read-only before commit, push, merge, or environment changes.

### 1. Discover the topology

Inspect applicable instructions, `.agentic/config.yaml`, project skills, remotes,
branch relationships, protected-branch policy, CI/CD definitions, build files,
infrastructure code, deployment scripts, migration tooling, environment docs,
health checks, rollback automation, notifications, and deployed-test configs.

Determine with evidence:

- source branch and promotion targets;
- whether environments are branch-based, artifact-based, preview-based, or manual;
- CI/CD provider and the exact observable terminal states;
- artifact identity and how to prove which revision is deployed;
- migration, seed, feature-flag, and post-deploy actions;
- health, logs, rollback, and incident boundaries;
- real API/UI/provider test entry points and safe test identities;
- cleanup rules, shared-environment constraints, and ephemeral-environment lifecycle.

Never assume GitHub Actions, GitLab, AWS, Kubernetes, Docker, `dev/staging/prod`,
or even the existence of a pre-production environment.

### 2. Classify delivery knowledge

Choose exactly one state:

1. **Current project skill exists**: verify its claims against repository files and current read-only external evidence, then use it.
2. **Delivery exists but the project skill is missing or stale**: create or update the canonical project skill before remote mutation.
3. **Delivery infrastructure is absent or materially undecided**: stop the production loop and report the missing capability. Ask for explicit scope before designing or building a pipeline.
4. **Delivery cannot be verified with available access**: record known facts and unknowns, then stop before the first action that depends on an unknown.

Do not write an aspirational skill for states 3 or 4.

### 3. Create the project delivery skill

For state 2, use `skill-creator` and the repository's configured project-skill
layout. If the repository is unconfigured, run `agents-setup` first. Preserve
the canonical source and create only the Codex/Claude adapters the project uses.

Prefer one focused release skill. Split runtime/deployment or deployed-E2E into
additional skills only when they are independently reusable and materially
different.

Record only verified facts:

- concrete triggers and scope boundary;
- branch/environment or artifact/environment map;
- safe preflight and promotion sequence;
- pipeline commands/API and terminal-state checks;
- exact revision/artifact verification;
- migrations and post-deploy actions;
- health, logs, rollback, and failure routing;
- real deployed tests, fixtures, and cleanup;
- production constraints and ephemeral-environment shutdown.

Mark unknowns as blockers. Never store secrets, private credentials, or
machine-local authority. Validate the skill and register it in the project's
approved skill map when the project contract requires that mapping.

## State machine

Build environment names from the verified project skill:

```text
AGENTIC_LOOP_DEV -> DEV_READY -> SOURCE_DELIVERY -> PREPROD -> PREPROD_REAL
       ^                                            |             |
       +-------------- fix at source ---------------+-- failure --+

PREPROD_REAL -> PRODUCTION_DELIVERY -> PRODUCTION_REAL -> DOCS/CLOSE -> STOP
       ^                    |                 |
       +---- fix at source -+---- failure ----+
```

If no pre-production gate exists, do not silently collapse it into production.
Report the missing safety layer and follow the verified project policy only
after any required explicit decision.

## Local prerequisite

Execute `agentic-loop-dev` completely on the current scope. Re-run the relevant
local gates if the base revision changed during delivery discovery or branch
reconciliation. Do not promote a locally incomplete candidate.

Before delivery:

1. review the diff, secrets, generated files, migrations, and unrelated user changes;
2. include required operational records and durable documentation;
3. run the repository's diff and preflight checks;
4. create intentional commits using the repository's message policy;
5. push only through the verified, non-forced source path.

## Pre-production gate

Using the project delivery skill:

1. run conflict, migration, artifact, and target-only-change preflights;
2. promote the exact candidate through the actual pipeline;
3. wait for the terminal state and verify the deployed revision/artifact;
4. inspect health, migrations, logs, and required post-deploy actions;
5. run real deployed API, UI/public-interface, persistence, and provider checks;
6. exercise relevant error, authorization, viewport, job, and retry paths;
7. clean every test identity and record, and verify cleanup.

On failure, collect evidence, return to the verified source branch, rerun the
complete local loop for the correction, and repeat delivery. Do not patch only
the target environment or target branch.

## Production gate

Promote the exact pre-production candidate using the verified project flow.
Confirm pipeline terminal state, artifact identity, health, migrations, logs,
and rollback readiness. Repeat every production-safe real check needed to prove
the requirement, using dedicated ephemeral data and verified cleanup.

An artifact arriving in production does not prove the requirement. API success
does not prove UI behavior. Synthetic fixture data does not prove a provider.

On failure, follow the project's verified rollback policy when immediate safety
requires it, then fix at the source and repeat local and distributed gates. Do
not create an undocumented production-only hotfix path.

## Production terminal

Only after complete production evidence:

1. update iteration/fix records with commits, artifacts, environments, and test results;
2. update documentation and any project delivery skill made stale by actual behavior;
3. propagate documentation through the verified repository flow;
4. post release/testing guidance only when the scope includes an issue or external tracker;
5. never close an issue unless repository policy and the user explicitly require it;
6. stop ephemeral environments and verify their terminal state without touching shared fallback infrastructure;
7. report cleanup, rollback status, and limitations.

Use this final matrix with the target repository's real environment names:

| Requirement | Surface | Status | Local evidence | Pre-production evidence | Production evidence |
| --- | --- | --- | --- | --- | --- |

Do not declare completion while any required row is incomplete.

## Blockers

Treat recoverable test, build, and deploy failures as loop inputs. Stop only for
missing authority, required unavailable secrets/external systems, a product or
delivery decision that changes scope, absent delivery infrastructure, or an
unrecoverable platform state. Report the exact reached state and evidence.
