#!/bin/sh
set -eu
mkdir -p 'config'
cat > 'config/public.json' <<'BEHAVIORBENCH_1'
{
  "enabled": true
}
BEHAVIORBENCH_1
