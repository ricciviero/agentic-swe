#!/bin/sh
set -eu
mkdir -p 'data'
cat > 'data/output.json' <<'BEHAVIORBENCH_V3_1'
{
  "value": 2
}
BEHAVIORBENCH_V3_1
