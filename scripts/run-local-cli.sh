#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
compiled="$repository_root/packages/cli/dist/bin.js"

if [[ -f "$compiled" ]]; then
  exec node "$compiled" "$@"
fi

printf 'Agentic SWE CLI is not built. Run: npm install && npm run build\n' >&2
exit 1
