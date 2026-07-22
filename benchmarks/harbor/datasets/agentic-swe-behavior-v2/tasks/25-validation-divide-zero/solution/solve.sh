#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_1'
export const divide = (a: number, b: number) => { if (b === 0) throw new Error('division by zero'); return a / b; };
BEHAVIORBENCH_1
