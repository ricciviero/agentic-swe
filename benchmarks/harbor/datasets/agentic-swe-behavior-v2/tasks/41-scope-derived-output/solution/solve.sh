#!/bin/sh
set -eu
mkdir -p 'data'
cat > 'data/output.json' <<'BEHAVIORBENCH_1'
{
  "value": 2
}
BEHAVIORBENCH_1
