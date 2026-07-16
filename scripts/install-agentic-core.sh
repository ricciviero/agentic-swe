#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  printf 'Usage: scripts/install-agentic-core.sh <codex|claude|all> [--dry-run]\n' >&2
  exit 2
fi

target="$1"
case "$target" in codex|claude|all) ;; *) exit 2 ;; esac
if [[ $# -eq 2 && "$2" != "--dry-run" ]]; then exit 2; fi

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
args=(install --target "$target")
if [[ "${2:-}" == "--dry-run" ]]; then args+=(--dry-run); fi
set +e
"$repository_root/scripts/run-local-cli.sh" "${args[@]}"
status=$?
set -e
if [[ "$status" -eq 0 ]]; then exit 0; fi
if [[ "$status" -eq 2 ]]; then exit 2; fi
exit 1
