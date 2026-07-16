# `@agentic-swe/cli`

Cross-platform command-line interface for Agentic SWE Protocol v1. It inspects and verifies repositories, evaluates typed requests, renders generated adapters, and installs or removes only owned global instruction surfaces.

```bash
agentic-swe inspect .
agentic-swe verify .
agentic-swe evaluate . --request-file request.json
agentic-swe doctor
agentic-swe install --target all --dry-run
```

`install`, `uninstall`, and `render --output` refuse unowned files and unexpected symlinks. Use `--json` for machine-readable output. Exit codes distinguish usage (`2`), invalid configuration (`3`), incompatible configuration (`4`), verification failure (`5`), and installation conflict (`6`).
