#!/usr/bin/env bash

# Provision a broad, shared Fedora development baseline. Run this as the
# normal developer user, never as root. Exact repository versions still belong
# in the repository's documented environment.
set -euo pipefail

dry_run=false
with_bun=false
with_docker_engine=false

usage() {
  cat <<'EOF'
Usage: install-fedora-development-baseline.sh [options]

Install a broad Fedora development baseline for a normal developer account.

Options:
  --dry-run             Print the commands without changing the machine.
  --with-bun            Install Bun with its official user-scoped installer.
  --with-docker-engine  Install and start the official Docker Engine daemon.
  -h, --help            Show this help text.

By default the script installs rootless Podman and podman-docker, which
provides a Docker-compatible CLI without a Docker daemon. --with-docker-engine
chooses the real Docker daemon instead and never adds the current user to the
root-equivalent docker group.

This script is for package-managed Fedora. It refuses rpm-ostree systems;
follow the Atomic Desktop and Toolbx workflow there instead.
EOF
}

while (($# > 0)); do
  case "$1" in
    --dry-run)
      dry_run=true
      ;;
    --with-bun)
      with_bun=true
      ;;
    --with-docker-engine)
      with_docker_engine=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

if ((EUID == 0)); then
  printf 'Run this script as the normal development user; it invokes sudo only for host packages.\n' >&2
  exit 1
fi

if command -v rpm-ostree >/dev/null 2>&1; then
  printf 'This is an rpm-ostree host. Use its Atomic Desktop workflow and Toolbx instead of this DNF bootstrap.\n' >&2
  exit 1
fi

if ! command -v dnf >/dev/null 2>&1; then
  if [[ "$dry_run" == true ]]; then
    printf 'Warning: this is a non-Fedora dry-run; commands below are not compatible with this host.\n' >&2
  else
    printf 'This script requires a package-managed Fedora host with dnf.\n' >&2
    exit 1
  fi
fi

run() {
  printf '+'
  printf ' %q' "$@"
  printf '\n'
  if [[ "$dry_run" != true ]]; then
    "$@"
  fi
}

if [[ "$with_docker_engine" == true ]] && rpm -q podman-docker >/dev/null 2>&1; then
  printf 'podman-docker is already installed and conflicts with Docker Engine’s docker CLI. Remove it deliberately, then rerun.\n' >&2
  exit 1
fi

packages=(
  bash-completion
  ca-certificates
  curl
  wget
  git
  git-lfs
  gh
  jq
  ripgrep
  fd-find
  fzf
  tmux
  zoxide
  direnv
  shellcheck
  unzip
  zip
  tar
  gzip
  bzip2
  xz
  file
  tree
  make
  automake
  gcc
  gcc-c++
  clang
  cmake
  ninja-build
  pkgconf-pkg-config
  openssl-devel
  libffi-devel
  zlib-devel
  bzip2-devel
  readline-devel
  sqlite-devel
  xz-devel
  python3
  python3-devel
  python3-pip
  pipx
  nodejs
  npm
  golang
  rust
  cargo
  java-21-openjdk-devel
  maven
  gradle
  podman
  podman-compose
  buildah
  skopeo
  toolbox
)

if [[ "$with_docker_engine" == true ]]; then
  docker_packages=(
    docker-ce
    docker-ce-cli
    containerd.io
    docker-buildx-plugin
    docker-compose-plugin
  )
else
  packages+=(podman-docker)
fi

run sudo dnf upgrade --refresh
run sudo dnf install "${packages[@]}"

if [[ "$with_docker_engine" == true ]]; then
  run sudo dnf install dnf-plugins-core
  run sudo dnf config-manager addrepo --from-repofile https://download.docker.com/linux/fedora/docker-ce.repo
  run sudo dnf install "${docker_packages[@]}"
  run sudo systemctl enable --now docker
  if [[ "$dry_run" == true ]]; then
    printf '%s\n' 'Docker Engine would be installed, but this script never adds users to the docker group.'
  else
    printf '%s\n' 'Docker Engine is installed, but this script does not add users to the docker group. Use sudo docker or configure rootless Docker deliberately.'
  fi
else
  if [[ "$dry_run" == true ]]; then
    printf '%s\n' 'Rootless Podman and its Docker-compatible CLI would be installed. The docker command would use Podman, not a Docker daemon.'
  else
    printf '%s\n' 'Rootless Podman and its Docker-compatible CLI are installed. The docker command uses Podman, not a Docker daemon.'
  fi
fi

if [[ "$with_bun" == true ]]; then
  if command -v bun >/dev/null 2>&1; then
    printf 'Bun is already available at %s\n' "$(command -v bun)"
  elif [[ "$dry_run" == true ]]; then
    printf '%s\n' '+ curl -fsSL https://bun.com/install | bash'
  else
    curl -fsSL https://bun.com/install | bash
  fi
fi

if [[ "$dry_run" == true ]]; then
  printf '%s\n' 'Dry run completed. Rerun without --dry-run only after reviewing the plan.'
else
  printf '%s\n' 'Baseline provisioning completed. Open a new shell before checking Bun, then use repository-defined versions and package managers for each project.'
fi
