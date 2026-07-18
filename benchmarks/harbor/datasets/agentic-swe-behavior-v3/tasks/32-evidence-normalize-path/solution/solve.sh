#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_V3_1'
export const normalizePath = (value: string) => value.replace(/\/{2,}/g, '/');
BEHAVIORBENCH_V3_1
