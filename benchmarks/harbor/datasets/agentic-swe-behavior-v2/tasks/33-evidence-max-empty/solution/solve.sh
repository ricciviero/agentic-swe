#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_1'
export const maxValue = (values: number[]) => values.length ? Math.max(...values) : null;
BEHAVIORBENCH_1
