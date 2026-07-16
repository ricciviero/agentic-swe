# Agentic SWE Protocol v1

Agentic SWE is an open behavior framework for software-engineering agents. This directory is the normative, agent-agnostic contract. It describes how a host decides workflow phase, gates, skill routing, requested capabilities, delivery criteria, and learning candidates without owning the host's model, concrete tools, permission system, storage, or user interface.

Protocol version `1.0` is normative. The TypeScript reference implementation lives in [`packages/core`](../../packages/core/) and [`packages/node`](../../packages/node/). [`core/agentic-protocol.md`](../../core/agentic-protocol.md) and the project templates are generated compatibility renderings; `npm run generate:check` rejects drift.

## Normative artifacts

- [`protocol.yaml`](protocol.yaml) is the canonical state machine and policy definition.
- [`schemas/`](schemas/) defines the serialized project configuration, input, plan, event, state, protocol, and conformance-case contracts.
- [`conformance/`](conformance/) contains normative input/expected-output examples for every required v1 path.
- [`core/agentic-protocol.md`](../../core/agentic-protocol.md) is a compatibility adapter, not a second source of behavior.
- [`skills/agents-setup`](../../skills/agents-setup/) and [`skills/iterations-planner`](../../skills/iterations-planner/) implement detailed procedures selected by the protocol.
- [`packages/core`](../../packages/core/) embeds generated protocol assets and evaluates them without I/O; [`packages/node`](../../packages/node/) supplies read-only repository inspection plus explicit adapter installation APIs.
- [`packages/cli`](../../packages/cli/) exposes inspection, evaluation, verification, rendering, and safe installation commands; [`packages/skills`](../../packages/skills/) distributes versioned skill assets and integrity metadata.

Normative terms such as **MUST**, **MUST NOT**, **SHOULD**, and **MAY** use their ordinary requirements meaning. When prose and `protocol.yaml` conflict, `protocol.yaml` and the conformance cases define v1 behavior.

## Host boundary

Agentic SWE owns:

- task-classification semantics and the conservative fallback;
- workflow phases and legal transitions;
- setup, planning, and verification gate conditions;
- requested abstract capabilities;
- selected-skill constraints;
- completion criteria, reason codes, and learning candidates.

The host owns:

- LLM providers and implementation of classifier/router ports;
- concrete tool definitions and execution;
- permissions, confirmations, sandboxing, and path containment;
- sessions, event storage, UI, streaming, and abort mechanics;
- project-specific instructions loaded from `AGENTS.md`.

The model may return typed intent, classification, and routing suggestions. It MUST NOT grant a capability. Effective capabilities are always:

```text
protocol requested capabilities
∩ host security policy
∩ user-selected mode
```

Any deny wins. A protocol/runtime failure MUST NOT fall back to mutation access.

## State machine

```text
discovery → classification → setup? → planning? → execution → verification → completion
                 │             │          │              │             │
                 └─────────────┴──────────┴──────────────┴─────────────┼→ blocked
                                                                       └→ aborted
```

| Phase | Purpose | Mutation boundary |
| --- | --- | --- |
| `discovery` | Establish repository root, instructions, config, and compatibility. | None. |
| `classification` | Validate a typed `trivial`, `non-trivial`, or `uncertain` result. | None. |
| `setup` | Satisfy the repository-configuration gate through `agents-setup`. | Setup allowlist only. |
| `planning` | Create/reconcile the configured iteration or fix record. | Planning workspaces only. |
| `execution` | Perform the requested implementation after applicable gates. | Host-approved workspace mutation. |
| `verification` | Collect evidence for hard completion criteria. | Read and host-approved validation commands. |
| `completion` | Report evidence and unresolved assumptions; consider learning signals. | None by default. |
| `blocked` | Stop because configuration, authority, permission, or external state prevents progress. | Read-only diagnostics. |
| `aborted` | Stop immediately after host/user abort. | None. |

An event not listed for the current phase in `protocol.yaml#transitions` is illegal. Hosts MUST reject it with a diagnostic and MUST preserve the prior valid state. `blocked`, `aborted`, and `completion` terminate the current request; a later user request starts or resumes through a new host evaluation rather than inventing an implicit transition.

## Classification

A task is `trivial` only when **all** of these are true:

1. the change is localized;
2. the operation is mechanically clear;
3. behavior and public contracts do not change;
4. no sequencing decision is needed.

A task is `non-trivial` when **any** listed v1 signal is present, including two independent deliverables, cross-layer behavior, migration, refactor, deployment, security work, unclear scope, or a required trade-off/acceptance criterion.

`uncertain` is a valid classifier result but its effective classification is always `non-trivial`. A host may accept an explicit human classification, but it still applies repository policy and capability intersection.

## Gates

### Setup

An unconfigured repository MAY execute a trivial mechanical task without creating policy. Explicit onboarding or non-trivial work MUST enter `setup`. Setup cannot be waived. The host verifies the canonical `AGENTS.md`, compatible `.agentic/config.yaml`, and required adapters before leaving the phase.

### Planning

Non-trivial work MUST have current planning evidence when the project planning gate is `non-trivial` or `always`. The detailed procedure belongs to `iterations-planner`. A user MAY explicitly request a lighter process; the host records the planning waiver reason and the completion report discloses it. Silence or model preference is not a waiver.

### Verification

Completion is forbidden while a hard criterion lacks evidence. Hosts distinguish verifiable criteria from qualitative guidance: validation commands, artifacts, and gate records can be hard evidence; semantic quality judgments remain soft requirements or reported assumptions.

## `BehaviorPlan`

The plan is a serializable decision, not a prompt. It includes:

- protocol/request identity;
- current phase and effective classification;
- setup/planning/verification gate status;
- selected skill references;
- requested abstract capabilities;
- completion-criterion status;
- stable reason codes and diagnostics;
- recorded overrides and learning actions when present.

An adapter may render the plan for a model or UI. Enforcement consumes the structured fields directly.

## Behavior extraction matrix

| Existing rule | v1 owner | Representation |
| --- | --- | --- |
| Read repository instructions before editing | Protocol | `discovery`, `repository.discovered` |
| Read `.agentic/config.yaml` | Protocol + Node host adapter | Discovery input and compatibility policy |
| Route unconfigured onboarding/non-trivial work | Protocol | Setup gate and `SETUP_REQUIRED` |
| Reconcile `AGENTS.md`, config, adapters, skill map | `agents-setup` skill | Setup evidence consumed by the protocol |
| Distinguish trivial/non-trivial/uncertain | Protocol | Classification criteria and conservative fallback |
| Preserve original brief and write concrete plan | `iterations-planner` skill | Planning evidence consumed by the protocol |
| Require planning before non-trivial edits | Protocol | Planning gate |
| User-requested lighter process | Protocol | Explicit, recorded planning waiver |
| Use smallest relevant approved skill set | Protocol | `skillRouting` policy |
| Read a selected skill before specialized action | Protocol + host adapter | `loadBeforeSpecializedAction` |
| Create durable project-specific skills | Protocol routes; setup/skill tooling performs | Project-skill candidate policy |
| Validate changed surface before completion | Protocol | Verification gate and hard evidence |
| Update durable docs when behavior changes | Protocol | `documentation-aligned` criterion |
| Report evidence and assumptions | Protocol | Completion criteria and reason codes |
| Capture repeated corrections in `AGENTS.md` | Protocol | Learning policy/action |
| Templates, file naming, numbering, indexes | Workflow skills | Procedural detail, outside core state machine |
| Codex managed block and owned Claude rule | Adapters/installers | Generated rendering and non-destructive installation, outside core state machine |
| Tool schemas, provider selection, TUI, persistence | Host | Explicitly outside Agentic SWE protocol |

## Configuration

`.agentic/config.yaml` remains the machine-readable project companion to `AGENTS.md`. Version 1 records active agent identifiers, the canonical project-skill directory, the approved global-skill map, and local workflow paths. The JSON Schema validates its YAML data model.

An unsupported config/protocol version enters `blocked` with read-only diagnostic capabilities. It never silently assumes a permissive configuration.

## Conformance cases

Each conformance JSON file contains:

```json
{
  "name": "stable-case-name",
  "protocolVersion": "1.0",
  "input": {},
  "expected": {}
}
```

Implementations MUST produce an equivalent normalized `BehaviorPlan` for every case. Ordering is significant for arrays in the fixtures. Extra diagnostic prose may vary, but stable codes, phase, gate status, capabilities, skills, completion state, overrides, and learning actions must match.

## Versioning

- `protocolVersion` changes only when serialized semantics or required behavior changes.
- Backward-compatible v1 additions increment the minor component (`1.1`). Breaking semantics require `2.0`.
- Package semver describes a specific implementation. Patch releases may fix an implementation while still implementing protocol `1.0`.
- Project config `version` is independent. A runtime publishes an explicit compatibility matrix for config and protocol versions.
- Adapters include or report the protocol version they render.

## Change discipline

A protocol change is incomplete unless it updates, in the same pull request:

1. `protocol.yaml`;
2. affected schema;
3. at least one conformance case;
4. this specification;
5. compatibility adapter text when semantics visible to prompt-only agents change.
