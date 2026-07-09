#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/verify-agentic-project.sh [repository-path]

Verify the portable Agentic SWE project contract without modifying files.
EOF
}

if [[ $# -gt 1 ]]; then
  usage >&2
  exit 2
fi

target="${1:-.}"
repository_root="$(cd "$target" && pwd -P)"
agents_file="$repository_root/AGENTS.md"
config_file="$repository_root/.agentic/config.yaml"
failures=0

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  failures=$((failures + 1))
}

config_value() {
  local key="$1"
  awk -F: -v key="$key" '
    $1 ~ "^[[:space:]]*" key "[[:space:]]*$" {
      value = $2
      sub(/^[[:space:]]*/, "", value)
      sub(/[[:space:]]*$/, "", value)
      gsub(/^['\"']|['\"']$/, "", value)
      print value
      exit
    }
  ' "$config_file"
}

if ! git -C "$repository_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "not a Git repository: $repository_root"
fi

if [[ ! -f "$agents_file" ]]; then
  fail "missing AGENTS.md"
elif ! grep -Fqx '## Agentic Workflow' "$agents_file"; then
  fail "AGENTS.md is missing the Agentic Workflow section"
fi

if [[ ! -f "$config_file" ]]; then
  fail "missing .agentic/config.yaml"
else
  for key in planning_gate iteration_directory fix_directory; do
    if [[ -z "$(config_value "$key")" ]]; then
      fail "config is missing $key"
    fi
  done

  iteration_directory="$(config_value iteration_directory)"
  fix_directory="$(config_value fix_directory)"
  for directory in "$iteration_directory" "$fix_directory"; do
    if ! git -C "$repository_root" check-ignore -q "$directory/.agentic-swe-probe"; then
      fail "local workspace is not ignored: $directory/"
    fi
  done

  if grep -Eq '^[[:space:]]*-[[:space:]]*claude-code[[:space:]]*$' "$config_file"; then
    if [[ ! -f "$repository_root/CLAUDE.md" ]]; then
      fail "Claude Code is configured but CLAUDE.md is missing"
    elif ! grep -Fqx '@AGENTS.md' "$repository_root/CLAUDE.md"; then
      fail "CLAUDE.md does not import AGENTS.md"
    fi
  fi
fi

if [[ "$failures" -gt 0 ]]; then
  exit 1
fi

printf 'Agentic project contract is valid: %s\n' "$repository_root"
