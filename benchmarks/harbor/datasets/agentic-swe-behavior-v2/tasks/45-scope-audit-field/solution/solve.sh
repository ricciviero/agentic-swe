#!/bin/sh
set -eu
mkdir -p '.'
cat > 'settings.json' <<'BEHAVIORBENCH_1'
{
  "theme": "green",
  "audit": "preserve"
}
BEHAVIORBENCH_1
