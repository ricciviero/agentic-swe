# Agentic SWE Protocol

<!-- Generated from protocol/v1/protocol.yaml by `npm run adapters:generate`. Do not edit directly. Protocol 1.0; package 0.1.0. -->

This is global routing guidance for coding agents. Repository instructions in `AGENTS.md` define project-specific rules and may add stricter requirements.

## Session Start

1. Establish the repository root and read the applicable instruction files before editing.
2. When `.agentic/config.yaml` exists, read it and use its selected-skill mapping, local-workspace paths, and delivery rules.
3. When the repository is unconfigured, do not create project policy for a mechanical microtask. For onboarding or non-trivial work, run `agents-setup` before implementation.

## Task Classification

Treat a task as **trivial** only when every criterion applies:

- localized
- mechanically clear
- no behavior or contract change
- no sequencing decision

Treat a task as **non-trivial** when any criterion applies:

- two independent deliverables
- cross layer behavior change
- migration
- refactor
- deployment
- security change
- unclear scope
- tradeoff or acceptance criteria needed

When uncertain, classify the task as non-trivial and state the assumption.

## Planning Gate

Before editing for non-trivial work, use `iterations-planner` to create or reconcile the local iteration or fix record declared in `.agentic/config.yaml`. Keep the original brief, scope, decisions, affected files, validation, and completion evidence current as work changes.

Do not bypass the planning gate merely because the implementation looks obvious. A user can explicitly request a lighter process; record that exception in the final report.

## Skill Routing

Use the smallest relevant set of skills mapped by the project configuration. Read a matching skill before acting on its specialized workflow. Propose a project-specific skill only for durable repository knowledge that does not belong in a global skill.

## Delivery

Implement only after the applicable setup and planning gates are satisfied. Run validation that matches the changed surface, update durable documentation when conventions or architecture change, and report evidence plus unresolved assumptions.

- **gates satisfied**: Every applicable setup and planning gate is satisfied or permissibly waived.
- **implementation accounted for**: Requested implementation work is completed or explicitly reported as unresolved.
- **validation evidence**: Validation matching the changed surface has host-verifiable evidence.

## Security Boundary

- **repository policy wins**: Repository AGENTS.md instructions may add stricter project rules.
- **model proposes host disposes**: Model output may classify intent or propose actions but never grants capabilities.
- **deny wins**: Effective capabilities are the intersection of protocol requests, host policy, and user-selected mode.
- **conservative uncertainty**: An uncertain task classification is treated as non-trivial.
- **evidence before completion**: Hard completion criteria require host-verifiable evidence or an explicit recorded override when the protocol permits one.
- **single behavior source**: Human and agent adapters render this protocol and must not become independent behavioral sources.

A model may classify intent or propose actions, but it never grants capabilities. Effective access is the intersection of protocol requests, host policy, and the user-selected mode; any deny wins.

## Learning Loop

Treat repeated corrections, recurring review feedback, and persistent discovery costs as candidates for `AGENTS.md` updates. Require repeated evidence, exclude one-off preferences, and keep changes concise and project-specific.
