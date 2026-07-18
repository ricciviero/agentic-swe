#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_1'
export const formatCents = (value: number) => `${value < 0 ? '-' : ''}$${Math.abs(value / 100).toFixed(2)}`;
BEHAVIORBENCH_1
