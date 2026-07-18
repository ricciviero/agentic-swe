# Contributing to Agentic SWE

Agentic SWE accepts changes through pull requests. Keep each change focused, preserve the public behavior boundary, and do not commit credentials, private paths, customer data, or material without a compatible license.

## Development workflow

```bash
npm install
npm run generate:check
npm run typecheck
npm test
npm run benchmark:check
npm run pack:check
npm run release:check
bash scripts/verify-agentic-project.sh .
```

Run `npm run generate` after changing the canonical protocol, generated adapters, templates, or public skill catalog. Commit every affected generated file. CI regenerates these outputs and rejects drift.

Protocol behavior changes must update `protocol/v1/protocol.yaml`, affected schemas, at least one conformance case, the normative specification, and visible adapters. Runtime changes need unit coverage and Node/Bun package smoke coverage. Installer changes need dry-run, conflict, ownership, symlink, and uninstall tests.

Changes under `benchmarks/` must preserve treatment parity, independent functional verification,
redaction, exact pins, and the frozen claim policy. Run `npm run benchmark:check`. Never commit
provider credentials, raw Harbor jobs, complete trajectories, sealed material, local tarballs, or
machine-specific paths. A published task is a regression fixture; changing a frozen task, verifier,
artifact, threshold, or treatment creates a new experiment ID rather than rewriting prior evidence.

Use `skill-creator` for a new or materially revised Codex skill. Keep `SKILL.md` concise, retain `name` and `description` frontmatter, update `agents/openai.yaml` only when its user-facing metadata becomes stale, and validate every changed skill.

## Pull requests

- Branch from the current `main`; do not push directly to the protected branch.
- Protection applies to administrators too. Force-pushes and deletion of `main` are disabled.
- The strict `test` status check must be current with `main`, and all review conversations must be resolved before merge.
- No approving review is required while the repository has one maintainer; the pull request and CI requirements still apply.
- Automatic deletion of merged branches is intentionally disabled.
- Use a Conventional Commit message for each logical change.
- Explain behavior or compatibility changes and include validation evidence.
- Keep generated assets, package metadata, documentation, and the compatibility matrix aligned.
- Describe any benchmark-facing change, whether it invalidates prior evidence, and which offline gates were rerun.
- Do not publish packages, create release tags, or change external installations as part of an ordinary contribution.

## Release policy

A maintainer first merges a release pull request into protected `main`, then creates a tag for that exact commit. Before publication, verify npm scope ownership, inspect every `npm pack --json` result, run the Node/Bun consumer smoke and `npm run release:check`, and keep all four package versions aligned for the `0.1.x` line. `release:check` is non-publishing and safe in ordinary CI: it validates package identity and contents through `npm pack --dry-run`, then exercises `npm publish --dry-run`. It accepts only npm's expected unauthenticated warning or exact same-version refusal for an already-public version, while still rejecting manifest auto-corrections, other warnings, and every unrelated failure. Registry publication is a manual maintainer action; trusted CI provenance may be added in a future release workflow. Registry publication, tag creation, and GitHub release creation require explicit maintainer authorization and are never performed by the ordinary test workflow. Follow the complete runbook in [`RELEASING.md`](RELEASING.md).
