#!/usr/bin/env bash
set -euo pipefail

if [[ $# -gt 1 ]]; then
  printf 'Usage: scripts/verify-agentic-project.sh [repository-path]\n' >&2
  exit 2
fi

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
set +e
"$repository_root/scripts/run-local-cli.sh" verify "${1:-.}"
status=$?
set -e
if [[ "$status" -eq 0 ]]; then exit 0; fi
if [[ "$status" -eq 2 ]]; then exit 2; fi
exit 1
