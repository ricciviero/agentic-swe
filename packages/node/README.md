# `@agentic-swe/node`

Read-only Node.js adapter for Agentic SWE Protocol v1. It discovers repository metadata, parses and validates `.agentic/config.yaml`, inventories approved skills, verifies planning records, and composes `@agentic-swe/core`.

```ts
import { createNodeRuntime } from "@agentic-swe/node";

const runtime = createNodeRuntime({
  startPath: process.cwd(),
  globalSkillDirectories: ["/path/to/approved/skills"],
  classifier,
  skillRouter,
});

const result = await runtime.evaluate({
  requestId: "request-1",
  summary: "Implement a cross-layer feature",
  planningRecord: "iterazioni/42-reference-runtime",
  hostCapabilities: ["repository:read", "workspace:mutate"],
  userModeCapabilities: ["repository:read"],
});

console.log(result.plan.phase, result.effectiveCapabilities);
```

`inspectRepository` and `runtime.evaluate` do not write files or execute commands. Returned repository paths are normalized; persisted behavior state contains request/session data rather than machine-specific repository paths. Symlinks and planning records that escape the repository are rejected.

Malformed or incompatible configuration produces structured diagnostics and a blocked/read-only `BehaviorPlan`. If no classifier is supplied, classification falls back to `uncertain`, which Protocol v1 treats as non-trivial.

## Compatibility

| Package | Core | Protocol | Config | Runtime |
|---|---|---|---|---|
| `0.1.x` | `0.1.x` | `1.0` | `1` | Node.js `>=20.18`, Bun `1.3+` |

The package is ESM-only and exports its entire supported API from the package root.
