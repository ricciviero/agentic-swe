# `@agentic-swe/core`

Pure TypeScript reference evaluator for Agentic SWE Protocol v1. The package has no runtime dependencies and performs no filesystem, network, shell, model, or tool I/O.

## Public API

- `evaluateBehavior(input)` returns a deterministic `BehaviorPlan`.
- `applyBehaviorEvent(state, event, satisfiedGuards)` validates and applies one legal transition.
- `createBehaviorState`, `serializeBehaviorState`, and `restoreBehaviorState` support host-owned persistence.
- `intersectCapabilities` applies the deny-wins intersection between protocol requests, host policy, and user mode.
- `runTaskClassifier` and `runSkillRouter` validate host ports and apply conservative fallbacks.
- `protocolV1` and `protocolSchemasV1` expose the embedded, generated v1 contract without a deep import.

```ts
import { evaluateBehavior, type BehaviorInput } from "@agentic-swe/core";

const plan = evaluateBehavior(input satisfies BehaviorInput);
if (plan.phase === "execution") {
  // The host still decides which requested capabilities are actually allowed.
}
```

Model output may classify or propose skill names. It never modifies gates or grants capabilities. Illegal transitions throw `TransitionError`; classifier/router errors, aborts, and bounded timeouts return typed diagnostics and conservative results.

## Compatibility

| Package | Protocol | Config | Runtime |
|---|---|---|---|
| `0.1.x` | `1.0` | `1` | Node.js `>=20.18`, Bun `1.3+` |

Package semver is independent from `protocolVersion`. The generated protocol assets are checked against `protocol/v1/` during the repository build.
