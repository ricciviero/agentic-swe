#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_1'
export const parsePort = (value: string) => { const port=Number(value); if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('invalid port'); return port; };
BEHAVIORBENCH_1
