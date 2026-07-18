#!/bin/sh
set -eu
mkdir -p '.'
cat > 'defaults.ts' <<'BEHAVIORBENCH_V3_1'
export const TIMEOUT = 45;
BEHAVIORBENCH_V3_1
