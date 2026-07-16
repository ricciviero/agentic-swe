# `@agenticswe/node`

Node.js adapter for Agentic SWE Protocol v1. Its repository inspection, verification, and evaluation APIs are read-only. Separate explicit APIs render generated adapters and install or uninstall only owned global instruction surfaces.

```ts
import { createNodeRuntime } from "@agenticswe/node";

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

`inspectRepository`, `verifyProject`, and `runtime.evaluate` do not write files or execute commands. Returned repository paths are normalized; persisted behavior state contains request/session data rather than machine-specific repository paths. Symlinks and planning records that escape the repository are rejected.

`renderAdapterToFile`, `installGlobalAdapters`, `uninstallGlobalAdapters`, and the source-checkout skill linker are opt-in mutation APIs. They expose dry-run results, use generated ownership markers, preserve unowned Codex content, and refuse unexpected symlinks or unowned destinations.

Malformed or incompatible configuration produces structured diagnostics and a blocked/read-only `BehaviorPlan`. If no classifier is supplied, classification falls back to `uncertain`, which Protocol v1 treats as non-trivial.

## Compatibility

| Package | Core | Protocol | Config | Runtime |
|---|---|---|---|---|
| `0.1.x` | `0.1.x` | `1.0` | `1` | Node.js `>=20.18`, Bun `1.3+` |

The package is ESM-only and exports its entire supported API from the package root.
