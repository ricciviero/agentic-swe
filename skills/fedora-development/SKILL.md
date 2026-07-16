---
name: fedora-development
description: Provision and use a full Fedora Linux coding environment for Codex-assisted development. Use when choosing a Fedora edition, installing Git, Python, Node, Bun, Docker or Podman, build tools, project toolchains, Codex CLI, Git workflows, or validation before a repository push.
---

# Fedora Development

Build a dependable Fedora environment for writing, testing, reviewing, and publishing code with Codex. Install a broad shared baseline once, then let each repository own its exact versions, dependencies, and validation commands.

## Discover before changing the machine

1. Read the repository instructions and its toolchain files before installing project software.
2. Identify the Fedora variant and package model:

   ```bash
   cat /etc/os-release
   command -v rpm-ostree && rpm-ostree status || true
   ```

3. Confirm whether a desktop is needed locally or the computer will later become headless. Do not configure SSH or a persistent worker unless the user requests it.
4. Inspect the current state before modifying it: `git status`, available disk and memory, existing language runtimes, `getenforce`, and enabled third-party repositories.
5. Read [development-environment.md](references/development-environment.md) before choosing an edition, changing the base host, installing Codex, or creating a container environment.

## Preserve the boundary between host and code

- Use Fedora Workstation for a normal local development PC. Use Fedora Server only when the machine is intentionally headless. Treat Atomic desktops as a separate `rpm-ostree` workflow; do not mix their host instructions with `dnf` guidance.
- Keep SELinux enforcing and use `firewalld`'s default-deny posture. Diagnose policy problems instead of disabling SELinux.
- Run Codex as a normal development user. Do not grant it passwordless `sudo`, root access, browser-stored secrets, cloud-admin credentials, or unrestricted access outside the intended workspace.
- Use the approved baseline installer for common CLI, build, language, and container tools. Put project-specific compilers, runtimes, databases, and experimental tools in the repository's documented environment or in Toolbx/Podman.
- Treat Toolbx as a convenient mutable development environment, not as a security boundary. Use rootless Podman with `podman-docker` by default; choose Docker Engine only when a repository actually needs its daemon or behavior. Do not add Codex to the root-equivalent `docker` group.
- Do not add a self-prompting loop, a `Restart=always` Codex service, or unattended task scheduling under this skill. Continuous operation and remote administration are separate, explicit decisions.

## Set up the development workflow

1. **Install Fedora and establish a baseline.** Use a supported stable Fedora release, verify the installation media, keep full-disk encryption and Secure Boot decisions deliberate, then update the host. See the installation and maintenance sections in the reference.
2. **Preview and install the shared tool baseline.** From the trusted skill directory, inspect the plan before making host changes:

   ```bash
   bash scripts/install-fedora-development-baseline.sh --dry-run
   ```

   With explicit approval, rerun without `--dry-run`. Add `--with-bun` for Bun. Add `--with-docker-engine` only when real Docker Engine is required; it is mutually exclusive with the default `podman-docker` CLI compatibility.
3. **Create an environment per toolchain.** The baseline includes Git, Python, Node/npm, Go, Rust, Java, common build tools, and rootless containers. Follow each repository's documented runtime version and use Toolbx or rootless Podman when a project needs isolated dependencies, .NET, a database, or any other SDK.
4. **Install and authenticate Codex interactively.** Follow the current official Codex CLI instructions, keep its credentials in the development user's local credential store, and verify the installed version before using it in a repository.
5. **Work in a clean repository.** Start from a named branch or worktree, ask Codex for a focused task, run the repository's formatter, type-check, tests, and build, then inspect `git diff` and `git status`.
6. **Publish deliberately.** Commit and push only reviewed changes after the relevant validation passes and the user or repository policy authorizes the remote write. Never bypass hooks, force-push, or include generated credentials, state, or local configuration.

## Validate the environment

Confirm the following before treating the machine as ready:

- Fedora is a supported stable release and the host has current updates.
- `git --version`, `python3 --version`, `node --version`, `go version`, `rustc --version`, `codex --version`, and the repository's required runtime commands work for the development user. Check `bun --version` only when Bun was selected.
- A Toolbx or rootless Podman smoke test succeeds when the project needs containers, without unexpected host mounts. If Docker Engine was selected, verify it with the approved access model; do not treat membership in the `docker` group as a harmless convenience.
- One representative repository can install dependencies, run its declared checks, and show a clean `git status` after a no-op Codex session.
- The backup and release-upgrade plan has been recorded outside the repository. Local snapshots alone are not a backup.

## References

- Read [development-environment.md](references/development-environment.md) for Fedora edition choices, installation, package management, containers, Codex setup, Git delivery, and links to current official sources.
