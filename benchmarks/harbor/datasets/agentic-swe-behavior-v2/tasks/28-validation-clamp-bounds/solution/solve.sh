#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_1'
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
BEHAVIORBENCH_1
