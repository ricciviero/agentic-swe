#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_V3_1'
export const isEven = (value: number) => Number.isInteger(value) && value % 2 === 0;
BEHAVIORBENCH_V3_1
