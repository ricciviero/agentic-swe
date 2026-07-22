#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/banner.ts' <<'BEHAVIORBENCH_V3_1'
export const banner = 'new';
BEHAVIORBENCH_V3_1
