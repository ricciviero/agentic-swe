#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_1'
export const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
BEHAVIORBENCH_1
