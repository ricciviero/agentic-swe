#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/install-agentic-core.sh <codex|claude|all> [--dry-run]

Install the Agentic SWE routing protocol in the selected agent's user-level
instruction surface. Existing personal instructions are preserved. Codex uses
a managed block in AGENTS.md; Claude Code uses a symlinked user rule.
EOF
}

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage >&2
  exit 2
fi

agent="$1"
dry_run=false

if [[ "${2:-}" == "--dry-run" ]]; then
  dry_run=true
elif [[ $# -eq 2 ]]; then
  usage >&2
  exit 2
fi

case "$agent" in
  codex|claude|all) ;;
  *)
    usage >&2
    exit 2
    ;;
esac

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
protocol="$repository_root/core/agentic-protocol.md"
begin_marker='<!-- agentic-swe:begin -->'
end_marker='<!-- agentic-swe:end -->'

if [[ ! -f "$protocol" ]]; then
  printf 'Agentic protocol not found: %s\n' "$protocol" >&2
  exit 1
fi

install_codex() {
  local destination_root destination begin_count end_count block tmp stripped
  destination_root="${CODEX_HOME:-$HOME/.codex}"
  destination="$destination_root/AGENTS.md"

  if [[ -L "$destination" ]]; then
    printf 'Conflict (symlink not replaced): %s\n' "$destination" >&2
    return 1
  fi

  if [[ "$dry_run" == true ]]; then
    if [[ -e "$destination" ]]; then
      printf 'Would add or refresh the managed Codex block in: %s\n' "$destination"
    else
      printf 'Would create Codex guidance: %s\n' "$destination"
    fi
    return 0
  fi

  mkdir -p "$destination_root"
  block="$(mktemp "${TMPDIR:-/tmp}/agentic-swe-codex.XXXXXX")"
  {
    printf '%s\n' "$begin_marker"
    cat "$protocol"
    printf '%s\n' "$end_marker"
  } > "$block"

  if [[ ! -e "$destination" ]]; then
    mv "$block" "$destination"
    printf 'Created Codex guidance: %s\n' "$destination"
    return 0
  fi

  begin_count="$(grep -Fxc "$begin_marker" "$destination" || true)"
  end_count="$(grep -Fxc "$end_marker" "$destination" || true)"
  if [[ "$begin_count" != "0" || "$end_count" != "0" ]]; then
    if [[ "$begin_count" != "1" || "$end_count" != "1" ]]; then
      rm -f "$block"
      printf 'Conflict (incomplete managed block): %s\n' "$destination" >&2
      return 1
    fi

    stripped="$(mktemp "${TMPDIR:-/tmp}/agentic-swe-codex.XXXXXX")"
    awk -v begin="$begin_marker" -v end="$end_marker" '
      $0 == begin { skip = 1; next }
      $0 == end { skip = 0; next }
      !skip { print }
    ' "$destination" > "$stripped"
    tmp="$(mktemp "${TMPDIR:-/tmp}/agentic-swe-codex.XXXXXX")"
    {
      cat "$stripped"
      printf '\n'
      cat "$block"
    } > "$tmp"
    rm -f "$stripped" "$block"
    mv "$tmp" "$destination"
    printf 'Refreshed Codex guidance: %s\n' "$destination"
    return 0
  fi

  tmp="$(mktemp "${TMPDIR:-/tmp}/agentic-swe-codex.XXXXXX")"
  {
    cat "$destination"
    printf '\n'
    cat "$block"
  } > "$tmp"
  rm -f "$block"
  mv "$tmp" "$destination"
  printf 'Added managed Codex guidance: %s\n' "$destination"
}

install_claude() {
  local destination_root destination
  destination_root="${CLAUDE_HOME:-$HOME/.claude}/rules"
  destination="$destination_root/agentic-swe.md"

  if [[ -L "$destination" && "$(readlink "$destination")" == "$protocol" ]]; then
    printf 'Already linked Claude Code rule: %s\n' "$destination"
    return 0
  fi

  if [[ -e "$destination" || -L "$destination" ]]; then
    printf 'Conflict (not replaced): %s\n' "$destination" >&2
    return 1
  fi

  if [[ "$dry_run" == true ]]; then
    printf 'Would link Claude Code rule: %s -> %s\n' "$destination" "$protocol"
    return 0
  fi

  mkdir -p "$destination_root"
  ln -s "$protocol" "$destination"
  printf 'Linked Claude Code rule: %s\n' "$destination"
}

failures=0
if [[ "$agent" == "codex" || "$agent" == "all" ]]; then
  install_codex || failures=$((failures + 1))
fi
if [[ "$agent" == "claude" || "$agent" == "all" ]]; then
  install_claude || failures=$((failures + 1))
fi

if [[ "$failures" -gt 0 ]]; then
  exit 1
fi
