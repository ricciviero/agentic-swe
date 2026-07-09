# Agentic SWE Protocol

This is global routing guidance for coding agents. Repository instructions in `AGENTS.md` define project-specific rules and may add stricter requirements.

## Session Start

1. Establish the repository root and read the applicable instruction files before editing.
2. When `.agentic/config.yaml` exists, read it and use its selected-skill mapping, local-workspace paths, and delivery rules.
3. When the repository is unconfigured, do not create project policy for a mechanical microtask. For onboarding or non-trivial work, run `agents-setup` before implementation.

## Task Classification

Treat a task as **trivial** only when it is localized, mechanically clear, has no behavior or contract change, and needs no sequencing decision.

Treat a task as **non-trivial** when it has two independently verifiable deliverables; changes behavior across layers; is a migration, refactor, deployment, or security change; has unclear scope; or needs a trade-off or acceptance criteria.

When uncertain, classify the task as non-trivial and state the assumption.

## Planning Gate

Before editing for non-trivial work, use `iterations-planner` to create or reconcile the local iteration or fix record declared in `.agentic/config.yaml`. Keep the original brief, scope, decisions, affected files, validation, and completion evidence current as work changes.

Do not bypass the planning gate merely because the implementation looks obvious. A user can explicitly request a lighter process; record that exception in the final report.

## Skill Routing

Use the smallest relevant set of skills mapped by the project configuration. Read a matching skill before acting on its specialized workflow. Propose a project-specific skill only for durable repository knowledge that does not belong in a global skill.

## Delivery

Implement only after the applicable setup and planning gates are satisfied. Run validation that matches the changed surface, update durable documentation when conventions or architecture change, and report evidence plus unresolved assumptions.

## Learning Loop

Treat repeated corrections, recurring review feedback, and persistent discovery costs as candidates for `AGENTS.md` updates. Keep changes concise, project-specific, and versioned; do not turn one-off preferences into repository policy.
