#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/banner.ts' <<'BEHAVIORBENCH_1'
export const banner = 'new';
BEHAVIORBENCH_1
