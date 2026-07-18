#!/bin/sh
set -eu
mkdir -p '.'
cat > 'feature.json' <<'BEHAVIORBENCH_V3_1'
{
  "enabled": true,
  "rollout": "internal"
}
BEHAVIORBENCH_V3_1
