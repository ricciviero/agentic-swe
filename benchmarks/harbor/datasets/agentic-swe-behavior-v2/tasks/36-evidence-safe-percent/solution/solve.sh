#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_1'
export const percentage = (part: number, total: number) => total === 0 ? 0 : part / total * 100;
BEHAVIORBENCH_1
