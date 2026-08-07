---
name: agentic-loop-dev
description: Run a persistent, repository-aware engineering loop through real local evidence and stop before commit or deployment. Use when the user says "agentic loop dev", "agentic-loop-dev", or an unqualified "agentic-loop", or asks the agent to investigate, plan, implement, double- or triple-check, and repeatedly test a non-trivial change locally until it is genuinely ready. Discover the repository's own runtime and validation flow instead of assuming Docker, a language, or an E2E framework.
---

# Agentic Loop Dev

## Contract

Take the named scope from evidence-backed investigation to a locally proven
result. Continue through diagnosis, planning, implementation, review, and test
failures until every required local gate is green.

End at `DEV_READY`: implementation, tests, operational record, and affected
documentation are complete in the working tree, but nothing has been committed,
pushed, merged, or deployed. Treat an unqualified `agentic-loop` as this safe
profile.

This workflow requests no capability by itself. Apply the repository's
instructions, host permissions, and user-selected mode at every action.

## Persistent development branch invariant

- Never create a branch tied to a feature, fix, task, issue, document, iteration, or agent run.
- Work only on the repository's explicitly designated persistent development branch. Discover its exact name from repository policy; do not assume it is `dev` and do not substitute the default, staging, or production branch.
- If the designated development branch is missing or ambiguous, stop before implementation and request a project decision. Do not invent a temporary branch as a workaround.
- If the worktree is on another branch, reconcile it safely with the designated development branch before editing. A dirty worktree or unrelated user changes are a blocker to an automatic switch, not permission to continue on the wrong branch.
- Long-lived personal branches are allowed only when project policy explicitly declares them; never create, delete, reset, or use one as the loop's delivery source without an explicit rule.

## Route required skills

Use the smallest relevant set after discovery:

- `agents-setup` for unconfigured non-trivial repositories;
- `iterations-planner` or the configured planning workflow before implementation;
- stack/domain skills for the code being changed;
- `docker-environments` only when the repository actually uses containers;
- the repository's project-specific local-runtime or E2E skills when present;
- `skill-creator` when durable, non-obvious local workflow knowledge needs a project skill.

Do not load release or deployment skills for mutations in this profile.

## Discover before planning

1. Establish the repository root and read every applicable instruction file.
2. Read `.agentic/config.yaml` when present and honor its planning paths and selected skills.
3. Inspect branch, remotes, dirty state, nested repositories, user changes to preserve, and the persistent development branch required by project policy. Prove that the worktree is on that branch before implementation.
4. Acquire the current brief, issue, comments, attachments, or requirement source named by the user.
5. Discover the real local topology from documentation and source: manifests, task runners, container files, migrations, seeds, test configs, and startup scripts.
6. Identify the public path under test: UI, API, CLI, library API, worker, data pipeline, provider, or a combination.
7. Create or reconcile the required iteration/fix record and extract a scope ledger with observable acceptance criteria.

For user-facing work, express the scope ledger as user journeys before
implementation. Give each journey a priority and record its public entry point,
real integration boundaries, expected persistence or downstream readback,
relevant viewport/input mode, and planned evidence. Fix the denominator before
testing so coverage cannot be inflated by splitting easy assertions or silently
dropping difficult journeys.

Never assume `docker compose`, `up.sh`, localhost ports, a database, Playwright,
or a particular branch name. Prefer a verified repository command over an
invented one.

If a reusable local workflow is important but undocumented, inspect and prove it
first. Then use `skill-creator` to create or update a concise project skill in
the canonical project-skill directory. Do not turn guesses into policy.

## State machine

```text
INVESTIGATE -> PLAN -> IMPLEMENT -> CHECK x2/x3 -> REAL_LOCAL
     ^                                  |             |
     +---------- defect or gap ---------+-------------+

REAL_LOCAL -> DOCS/EVIDENCE -> DEV_READY -> STOP
     ^              |
     +-- mismatch --+
```

Do not skip a state. A later check does not compensate for a missing earlier
contract or an untested user path.

## Investigate and plan

- Reproduce current behavior before changing it whenever a defect is observable.
- Trace the complete write/read path through every affected layer.
- Compare visual work at the relevant viewports and interaction states.
- Inspect persistence, queries, ordering, retries, concurrency, and cleanup for data work.
- Search the full relevant module for symmetric implementations and prior regressions.
- Record a root cause only when repeatable evidence supports it.
- Design a regression test that would reject the incorrect behavior.
- Design the user-facing flow before building a backend capability that users must operate.

Keep the plan and scope ledger current when discovery changes the work.

## Manual-to-E2E parity gate

Before implementation, derive a Manual Acceptance Ledger from the exact replay
a user or consumer would follow to prove the change from a clean, reproducible
state. For each row record the role or identity, public entry point, actions,
observable result, real boundaries, downstream readback, relevant client or
viewport, cleanup, and planned evidence. Classify every row as:

- `AUTOMATABLE`: safe, deterministic, repeatable, and suitable for an executable real-journey test;
- `AGENT_EXECUTABLE`: safely exercisable by the agent through the real public path, but not reasonably expressible as durable automation;
- `HUMAN_ONLY`: dependent on subjective human judgment or an intrinsically personal action;
- `EXTERNAL_BLOCKED`: dependent on unavailable authority, credentials, hardware, or an external system.

Treat every safe, deterministic, repeatable in-scope row as `AUTOMATABLE` unless
the operational record gives a concrete reason otherwise. Before `DEV_READY`,
each `AUTOMATABLE` row must have executable real-journey coverage and an
agent-recorded passing run; each `AGENT_EXECUTABLE` row must have an
agent-recorded real execution. `HUMAN_ONLY` and `EXTERNAL_BLOCKED` rows remain
explicit limitations and cannot be counted as green evidence for a required
terminal gate.

Mocks, intercepted responses, direct persistence edits, and substitute services
may supplement the ledger but cannot certify the real boundary they replace.
The agent owns the first acceptance pass. A manual checklist may be delivered
only as replay guidance after its agent-executable rows have recorded results.
If a new replay step first appears while preparing handoff guidance or after a
readiness claim, invalidate that state, add the row, implement the required
coverage, and rerun every affected gate.

## Operational configuration gate

Classify every new or changed setting before implementation. A runtime or
business setting that an operator is expected to change during normal service is
incomplete unless the delivered path includes:

- durable canonical persistence;
- an authenticated and role-authorized API;
- an understandable control surface in the product's existing admin or back-office UI;
- validation plus loading, error, success, and permission feedback;
- readback of the effective value, including any active override or pending state;
- safe live application, or an explicit restart-required state when live application is technically unsafe.

Do not accept an environment variable, container edit, direct database update,
or restart command as the normal operator experience. Environment variables and
deployment secret stores remain valid for infrastructure-managed secrets,
bootstrap defaults, documented emergency overrides, and startup/infrastructure
settings. Record precedence and lifecycle whenever persisted state and an
override can coexist. Product-managed credentials require secure storage,
masked readback, and a rotation path; never expose plaintext secrets in UI, API
responses, logs, or evidence.

Do not invent an admin surface for a compile-time or internal-only constant.
When a value is intentionally not operator-adjustable, record that boundary in
the plan so it cannot silently become an ENV-only operational feature.

## Implement

- Implement from the source-of-truth layer toward consumers.
- Include every user-facing surface and its loading, empty, error, success, permission, and responsive states.
- Update contracts, types, migrations, fixtures, and tests in the same change.
- Do not add invented fallback data or test-only production behavior to obtain green output.
- Search for the corrected pattern across the relevant module and fix every applicable path.
- Preserve unrelated worktree changes and avoid destructive repository operations.

## Double or triple check

Run at least two independent passes after each candidate implementation:

1. **Coverage pass**: map every scope-ledger item to implementation and a test; inspect the last requested deliverable first.
2. **Adversarial pass**: probe invalid input, authorization, empty/loading/error states, null/zero, concurrency, responsive behavior, write-to-read visibility, side effects, and cleanup.

Add a third pass for security, payments, migrations, ranking, external
providers, broad refactors, or changes spanning more than two layers. Return to
implementation for every gap and repeat until a pass finds none.

## User-journey and experience gate

For changes that users operate through a UI or other public interface:

1. Exercise every required `AUTOMATABLE` and `AGENT_EXECUTABLE` ledger row,
   including every critical in-scope journey, through the real public
   interface. Apply any stricter repository percentage or browser matrix.
2. Do not count a test as real for any boundary it replaces with network
   interception, a stub server, a synthetic response, an in-memory substitute,
   or an equivalent mock. Keep those tests as supplementary edge-case evidence.
3. For a write, observe the user-visible result and read the new state through
   the intended consumer or another real authenticated public path. A successful
   request alone is incomplete evidence.
4. Cover the relevant desktop and narrow/mobile layouts and additional browser
   engines when compatibility, authentication, or the brief makes them material.
5. Test keyboard access, visible focus, accessible names, semantic structure,
   readable contrast, and the absence of unintended horizontal overflow where
   they apply to the changed journey.
6. Review loading, empty, error, success, disabled, permission, retry, and
   interruption states. Use inline, actionable feedback for normal task flows;
   do not accept a polished happy-path screenshot as proof of complete UX.
7. Compare the changed surface with the product's existing visual system at the
   relevant states and viewports. Record screenshots or equivalent inspectable
   artifacts when visual behavior is part of acceptance.

Treat visual quality as an evidence-backed gate, not an absolute claim of
perfection. Record unexercised journeys and environmental limits explicitly; a
skip, unsupported browser, or unavailable real dependency is not green.

## Real local gate

Use the repository's discovered startup and validation commands. Build a missing
local harness only when it is part of the requested scope and the repository
rules allow it.

Run, as applicable:

1. configuration, format, lint, type, compile, migration, and targeted tests;
2. the proportional regression suite for affected domains;
3. the actual application stack or public package/CLI entry point;
4. real browser/API/CLI journeys across the changed behavior;
5. real persistence and write-to-read checks;
6. provider sandbox/live checks when the requirement depends on an external provider;
7. viewport, media, accessibility, job, retry, and cleanup checks required by the scope.

For user-facing scope, calculate real-journey coverage from the ledger, not from
test or assertion counts. Every required automatable or agent-executable row and
any stricter repository-required coverage must be green before the real local
gate passes.

Classify evidence precisely:

| Evidence | Demonstrates |
| --- | --- |
| static/unit/integration | an isolated contract or logic path |
| real local application | actual application layers and persistence, possibly with declared fixtures |
| provider live/sandbox | real provider network, mapping, persistence, API, and consumer path |
| real local UI/public interface | the actual browser, CLI, or public API behavior users exercise |

Mocks may test edge cases, but they cannot certify the real local gate. A skipped
test is not green. An HTTP success alone does not certify UI behavior. A fixture
cannot be described as provider-live evidence.

## Dev terminal

Only after the complete local gate is green:

1. update the operational record with requirement-to-evidence mapping;
2. update durable documentation made stale by the implementation;
3. validate any changed project skills and their required adapters/mirrors;
4. verify cleanup and inspect the diff for secrets or unrelated files;
5. restore services started by the task when repository policy or the user requires it, without stopping shared infrastructure;
6. report `DEV_READY`, exact commands/results, and honest limitations.

Stop before commit, push, merge, remote environment changes, release comments,
or deployment. A staging continuation requires a separate explicit staging
request or `agentic-loop-staging`; a production continuation requires a separate
explicit production-qualified request and `agentic-loop-prod`.

Use this final matrix:

| Requirement | Ledger row | Class | Surface | Status | Local evidence |
| --- | --- | --- | --- | --- | --- |

Do not claim `DEV_READY` while any required row is incomplete.

## Blockers

Continue while a safe in-scope action remains. Stop only for missing authority,
an unavailable required secret or external system, a product decision that
changes scope, or an unrecoverable environment problem. Report the exact state
and completed evidence without converting the blocker into a success.
