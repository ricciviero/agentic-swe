#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/link-skills.sh <codex|claude> [--dry-run]

Create non-destructive symlinks from this repository's skills directory to
the selected agent's global skill directory. Existing paths are never replaced.
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
  codex)
    destination_root="${CODEX_HOME:-$HOME/.codex}/skills"
    ;;
  claude)
    destination_root="${CLAUDE_HOME:-$HOME/.claude}/skills"
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
source_root="$repository_root/skills"

if [[ ! -d "$source_root" ]]; then
  printf 'Skills directory not found: %s\n' "$source_root" >&2
  exit 1
fi

if [[ "$dry_run" == true ]]; then
  printf 'Would ensure destination directory: %s\n' "$destination_root"
else
  mkdir -p "$destination_root"
fi

conflicts=0
linked=0
skipped=0

for source in "$source_root"/*; do
  [[ -d "$source" && -f "$source/SKILL.md" ]] || continue

  skill_name="$(basename "$source")"
  destination="$destination_root/$skill_name"

  if [[ -L "$destination" && "$(readlink "$destination")" == "$source" ]]; then
    printf 'Already linked: %s\n' "$skill_name"
    skipped=$((skipped + 1))
    continue
  fi

  if [[ -e "$destination" || -L "$destination" ]]; then
    printf 'Conflict (not replaced): %s\n' "$destination" >&2
    conflicts=$((conflicts + 1))
    continue
  fi

  if [[ "$dry_run" == true ]]; then
    printf 'Would link: %s -> %s\n' "$destination" "$source"
  else
    ln -s "$source" "$destination"
    printf 'Linked: %s\n' "$skill_name"
  fi
  linked=$((linked + 1))
done

printf 'Summary: %d linked, %d already linked, %d conflicts.\n' "$linked" "$skipped" "$conflicts"

if [[ "$conflicts" -gt 0 ]]; then
  exit 1
fi
