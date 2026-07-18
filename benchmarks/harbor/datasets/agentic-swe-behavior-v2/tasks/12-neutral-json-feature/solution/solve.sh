#!/bin/sh
set -eu
mkdir -p '.'
cat > 'feature.json' <<'BEHAVIORBENCH_1'
{
  "enabled": true,
  "rollout": "internal"
}
BEHAVIORBENCH_1
