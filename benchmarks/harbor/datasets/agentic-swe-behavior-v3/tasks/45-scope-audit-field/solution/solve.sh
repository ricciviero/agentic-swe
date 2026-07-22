#!/bin/sh
set -eu
mkdir -p '.'
cat > 'settings.json' <<'BEHAVIORBENCH_V3_1'
{
  "theme": "green",
  "audit": "preserve"
}
BEHAVIORBENCH_V3_1
