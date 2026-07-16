# Compatibility

Protocol versions, project configuration versions, adapter generation, and package SemVer evolve independently.

| Protocol | Project config | Package line | Generated adapter | Runtime support |
| --- | --- | --- | --- | --- |
| `1.1` | `1` | `0.1.x` | Protocol `1.1`, package `0.1.x` header | Node.js `>=20.18`; Bun `1.3.x` consumer smoke |

All packages in the first `0.1.x` release candidate are version-aligned: `@agentic-swe/core`, `@agentic-swe/node`, `@agentic-swe/skills`, and `@agentic-swe/cli`. Inter-package dependencies use exact `0.1.0` versions so a host cannot accidentally combine incompatible development builds.

An incompatible `.agentic/config.yaml` version produces a blocked/read-only result and CLI exit code `4`; it never falls back to mutation. A malformed v1 configuration uses exit code `3`. Generated adapter text is derived from the normative protocol and checked by `npm run generate:check`.

Registry publication is a separate release action. Until a release is explicitly announced, consume tarballs produced by `npm pack`/`npm run pack:check` or use a source checkout.
