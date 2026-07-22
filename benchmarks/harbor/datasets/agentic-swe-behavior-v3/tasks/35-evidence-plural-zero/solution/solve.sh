#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_V3_1'
export const itemLabel = (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`;
BEHAVIORBENCH_V3_1
