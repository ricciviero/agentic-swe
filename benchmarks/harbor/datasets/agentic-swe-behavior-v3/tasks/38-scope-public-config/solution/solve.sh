#!/bin/sh
set -eu
mkdir -p 'config'
cat > 'config/public.json' <<'BEHAVIORBENCH_V3_1'
{
  "enabled": true
}
BEHAVIORBENCH_V3_1
