# Security Policy

## Supported versions

Agentic SWE is currently in the `0.x` development series. Security fixes target the latest published package line and the current `main` branch. The repository changelog and compatibility matrix identify supported protocol/package combinations.

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose user files, credentials, installer targets, or permission boundaries. Use GitHub's private vulnerability reporting for this repository. Include the affected package/version, reproduction, expected boundary, and the smallest safe proof of impact.

## Security boundaries

- The model may classify or propose; it never grants capabilities.
- Hosts compute effective capabilities with deny-wins intersection and retain their own permission enforcement.
- Repository inspection and behavior evaluation are read-only.
- Installers modify only generated, explicitly owned surfaces and refuse unowned files or unexpected symlinks.
- Skill package paths are resolved from the signed manifest allowlist; traversal is rejected.
- No package should contain credentials, private machine paths, customer data, or source-map paths from a contributor workstation.
