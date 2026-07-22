#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_1'
export const uniqueValues = (values: string[]) => [...new Set(values)];
BEHAVIORBENCH_1
