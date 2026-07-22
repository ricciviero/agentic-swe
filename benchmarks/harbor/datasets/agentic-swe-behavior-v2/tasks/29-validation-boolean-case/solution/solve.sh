#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_1'
export const parseBoolean = (value: string) => { const normalized=value.toLowerCase(); if (normalized==='true') return true; if (normalized==='false') return false; throw new Error('invalid boolean'); };
BEHAVIORBENCH_1
