# Fedora Development Environment

Use this reference when provisioning or changing a Fedora workstation for code work. Re-check the linked official documentation before commands that depend on a Fedora release or Codex CLI version.

## Scope and machine choice

The desired workflow is simple: develop in a repository, use Codex to help implement and validate changes, then publish reviewed work. A continuously powered machine and later remote access are deployment details, not prerequisites for a healthy development environment.

Choose the Fedora variant deliberately:

| Situation | Default choice | Operational consequence |
| --- | --- | --- |
| Local monitor, browser, IDE, and straightforward development | Fedora Workstation | Use the standard package-managed desktop and add tools with `dnf` as needed. |
| Intentionally headless machine with no desktop workflow | Fedora Server | Keep the same developer-user and Git model, but plan remote administration separately. |
| Immutable desktop and container-first workflow | Fedora Atomic Desktop | Learn `rpm-ostree` and use Toolbx for mutable development tools; do not apply ordinary `dnf` host instructions blindly. |

Do not use Rawhide or a pre-release for a machine that must reliably deliver code. Fedora's release index should be the source of truth for supported releases; do not encode a release number into automation.

Fedora's published installation baseline is not a capacity plan for coding workloads. Size CPU, RAM, and NVMe storage for the heaviest expected combination of compiler, test suite, local database, browser, and containers. Prefer x86_64 hardware with UEFI, working graphics and networking, and hardware virtualization when projects need virtual machines. Check Linux support for the exact Wi-Fi, GPU, storage, and suspend hardware before purchase.

## Installation and first boot

1. Download a current stable image only from Fedora. Verify its checksum or signature and use Fedora Media Writer or another direct-write method for the USB installer.
2. Preserve Secure Boot unless there is a known hardware reason not to. Enable full-disk encryption unless the user explicitly accepts the security trade-off of an unattended boot design. A lost LUKS passphrase cannot be recovered.
3. Keep an offline recovery route: the installer USB, the disk-encryption recovery material stored safely, and a tested backup. Btrfs snapshots on the same disk do not replace an external backup.
4. After first boot, inspect instead of assuming:

   ```bash
   cat /etc/os-release
   uname -r
   getenforce
   systemctl is-active firewalld
   df -h
   free -h
   ```

5. Update a package-managed Fedora host before adding tools:

   ```bash
   sudo dnf upgrade --refresh
   ```

   Reboot when the update or the machine's policy requires it. Do not turn release upgrades, firmware changes, or automatic reboots into a background coding-agent action.

Keep SELinux enforcing. If a legitimate development service needs a non-standard path or port, inspect the AVC denial and correct labels or policy instead of turning SELinux off. Keep `firewalld` enabled; remote access is optional and should be added only after its source network and recovery path are known.

## Shared tools and project toolchains

Use the bundled installer for a broad shared baseline on a package-managed Fedora Workstation or Server. It is intentionally explicit: preview first, then make the privileged change from a trusted checkout.

```bash
bash scripts/install-fedora-development-baseline.sh --dry-run
bash scripts/install-fedora-development-baseline.sh
```

The default DNF baseline contains these categories:

| Category | Included tools |
| --- | --- |
| Source control and shell | Git, Git LFS, GitHub CLI, Bash completion, `tmux`, `direnv`, `zoxide` |
| Everyday CLI | CA certificates, `curl`, `wget`, `jq`, `ripgrep`, `fd`, `fzf`, `file`, archive tools, `tree`, ShellCheck |
| Native builds | Make, Autotools, GCC/G++, Clang, CMake, Ninja, pkg-config, and common Python/native-extension libraries |
| Language baseline | Python/pip/pipx, Node/npm, Go, Rust/Cargo, Java 21, Maven, and Gradle |
| Containers | Podman, `podman-compose`, Buildah, Skopeo, Toolbx, and `podman-docker` |

The list is intentionally broad, but it is not a promise to install every SDK in the ecosystem. Keep exact language versions project-scoped: follow each repository's lockfiles, version-manager files, container configuration, and `AGENTS.md`. Install specialized SDKs such as .NET, Android, iOS, cloud CLIs, databases, browser automation, or a specific JavaScript version only when a project needs them. This prevents one project silently breaking another.

### Bun

Bun is installed only with an explicit flag because it is user-scoped and evolves independently of Fedora packages:

```bash
bash scripts/install-fedora-development-baseline.sh --with-bun
bun --version
```

The flag runs Bun's current official Linux installer as the development user. Open a new shell if its installer has just updated the shell `PATH`. Keep a repository's declared Bun version or package manager configuration authoritative.

### Toolbx

Toolbx is useful when a project needs a mutable Fedora userland with compilers and SDKs that should not become host dependencies:

```bash
toolbox create --container project-dev
toolbox enter project-dev
```

Inside the container, install the project toolchain with its package manager. Toolbx deliberately integrates with the host user and home directory; do not use it to execute untrusted code or protect secrets from the host user.

### Podman compatibility and Docker Engine

The default installer uses rootless Podman for local databases, test services, and reproducible development containers. It also installs `podman-docker`, so a repository that calls `docker` can often work without a Docker daemon. This is command-line compatibility, not Docker Engine behavior. Before running a compose file or image, inspect its ports, mounts, environment variables, and image source. Do not mount the home directory, container runtime socket, SSH keys, or secret files by default. Verify rootless operation when it matters:

```bash
podman info --format '{{.Host.Security.Rootless}}'
```

Use a project-specific `compose.yaml`, Containerfile, or dev-container definition when it exists. Do not replace a repository's Docker workflow merely to standardize on Fedora tools.

Choose actual Docker Engine only when the repository's tests, Compose features, third-party tooling, or documentation require a Docker daemon. Start with a preview because this enables Docker's official Fedora repository and starts a privileged system service:

```bash
bash scripts/install-fedora-development-baseline.sh --with-docker-engine --dry-run
bash scripts/install-fedora-development-baseline.sh --with-docker-engine
sudo docker version
```

This is an alternative to the default `podman-docker` compatibility package; do not mix their `docker` CLIs. The script deliberately does **not** add the development or Codex user to Docker's `docker` group: Docker documents that group as root-level privileged. Use `sudo docker` or configure rootless Docker intentionally if Docker Engine is genuinely required.

## Codex and the local skill bundle

Install Codex with the current official Linux instructions, then authenticate in an interactive shell as the normal development user. The current official CLI guide is the source of truth because the installer, login paths, models, and permissions evolve. Keep credentials out of shell history, Git repositories, service units, prompts, and committed `.env` files.

After installation, confirm the client is available:

```bash
codex --version
```

Launch Codex from the repository root. Inspect the active permissions and project instructions before letting it edit or run commands. Create Git checkpoints before and after a task; use a worktree when tasks must remain isolated.

To use this skill bundle on the Fedora machine, clone or otherwise place the trusted `agentic-swe` repository in a stable local location. Preview its non-destructive installers before changing global configuration:

```bash
bash scripts/install-agentic-core.sh codex --dry-run
bash scripts/link-skills.sh codex --dry-run
```

Resolve reported link conflicts deliberately. The linker does not replace existing global skills.

## Repository delivery loop

For every repository, use this order:

1. Read `AGENTS.md`, the README, and package/toolchain files.
2. Start from a clean worktree and record the branch:

   ```bash
   git status --short --branch
   ```

3. Ask Codex for a bounded task with an explicit definition of done.
4. Run the repository's formatter, type checker, tests, build, and any focused smoke test.
5. Review the patch before staging:

   ```bash
   git diff --check
   git diff
   git status --short
   ```

6. Commit and push only after the requested checks pass and a user or repository policy authorizes the remote write. Never use `git push --force`, bypass hooks, or publish secrets and generated local state.

## Optional later concerns

SSH, a power-loss recovery design, automatic updates, and a continuously running task worker require their own threat model and operating policy. Add them only when the normal local development flow is proven. In particular, test a key-based SSH session before changing authentication, keep public network exposure closed by default, and do not create an unbounded Codex loop or a service that restarts indefinitely.

## Official sources checked

- [Fedora Workstation downloads and media verification](https://fedoraproject.org/en/workstation/download/)
- [Fedora release index](https://fedoraproject.org/wiki/Releases)
- [Fedora system-upgrade guidance](https://docs.fedoraproject.org/en-US/quick-docs/upgrading-fedora-offline/)
- [Fedora automatic-update guidance](https://docs.fedoraproject.org/en-US/quick-docs/autoupdates/)
- [Toolbx installation and usage](https://containertoolbx.org/install/)
- [Podman installation documentation](https://podman.io/docs/installation)
- [Docker Engine installation on Fedora](https://docs.docker.com/engine/install/fedora/)
- [Bun installation](https://bun.sh/docs/installation)
- [Codex CLI documentation](https://learn.chatgpt.com/docs/codex/cli)
