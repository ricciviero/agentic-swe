#!/bin/sh
set -eu
mkdir -p '.'
cat > 'client.json' <<'BEHAVIORBENCH_1'
{
  "retries": 3,
  "mode": "safe"
}
BEHAVIORBENCH_1
