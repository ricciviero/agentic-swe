#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_V3_1'
export const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
BEHAVIORBENCH_V3_1
