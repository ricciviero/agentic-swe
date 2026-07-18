#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_1'
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
BEHAVIORBENCH_1
