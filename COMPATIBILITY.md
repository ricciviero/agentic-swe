# Compatibility

Protocol versions, project configuration versions, adapter generation, and package SemVer evolve independently.

| Protocol | Project config | Package line | Generated adapter | Runtime support |
| --- | --- | --- | --- | --- |
| `1.1` | `1` | `0.1.x` | Protocol `1.1`, package `0.1.x` header | Node.js `>=20.18`; Bun `1.3.x` consumer smoke |

All packages in the published `0.1.x` line are version-aligned: `@agenticswe/core`, `@agenticswe/node`, `@agenticswe/skills`, and `@agenticswe/cli`. Inter-package dependencies use exact `0.1.0` versions so a host cannot accidentally combine incompatible development builds.

An incompatible `.agentic/config.yaml` version produces a blocked/read-only result and CLI exit code `4`; it never falls back to mutation. A malformed v1 configuration uses exit code `3`. Generated adapter text is derived from the normative protocol and checked by `npm run generate:check`.

Version `0.1.0` is available from the public npm registry. Unreleased development builds must still be consumed through tarballs produced by `npm pack`/`npm run pack:check` or from a source checkout.

## Reference host

| Host | Host version | Agentic SWE packages | Protocol | Default mode |
| --- | --- | --- | --- | --- |
| [Interference](https://github.com/ricciviero/interference) | `0.6.0` | exact `0.1.0` pins for `core`, `node`, and `skills` | `1.1` | authoritative |

Interference users install only `interference-agent`; its package manifest resolves the framework
dependencies automatically. `@agenticswe/cli` is not a runtime dependency of the host.
