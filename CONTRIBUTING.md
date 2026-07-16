# Contributing to Agentic SWE

Agentic SWE accepts changes through pull requests. Keep each change focused, preserve the public behavior boundary, and do not commit credentials, private paths, customer data, or material without a compatible license.

## Development workflow

```bash
npm install
npm run generate:check
npm run typecheck
npm test
npm run pack:check
bash scripts/verify-agentic-project.sh .
```

Run `npm run generate` after changing the canonical protocol, generated adapters, templates, or public skill catalog. Commit every affected generated file. CI regenerates these outputs and rejects drift.

Protocol behavior changes must update `protocol/v1/protocol.yaml`, affected schemas, at least one conformance case, the normative specification, and visible adapters. Runtime changes need unit coverage and Node/Bun package smoke coverage. Installer changes need dry-run, conflict, ownership, symlink, and uninstall tests.

Use `skill-creator` for a new or materially revised Codex skill. Keep `SKILL.md` concise, retain `name` and `description` frontmatter, update `agents/openai.yaml` only when its user-facing metadata becomes stale, and validate every changed skill.

## Pull requests

- Branch from the current `main`; do not push directly to the protected branch.
- Use a Conventional Commit message for each logical change.
- Explain behavior or compatibility changes and include validation evidence.
- Keep generated assets, package metadata, documentation, and the compatibility matrix aligned.
- Do not publish packages, create release tags, or change external installations as part of an ordinary contribution.

## Release policy

A maintainer first merges a release pull request into protected `main`, then creates a tag for that exact commit. Before publication, verify npm scope ownership, inspect every `npm pack --json` result, run the Node/Bun consumer smoke, and keep all four package versions aligned for the `0.1.x` line. Publish public packages with registry provenance when the CI/registry credentials support it. Registry publication, tag creation, and GitHub release creation require explicit maintainer authorization and are never performed by the ordinary test workflow.
