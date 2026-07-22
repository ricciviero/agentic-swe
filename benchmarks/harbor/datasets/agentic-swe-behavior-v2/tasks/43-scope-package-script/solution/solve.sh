#!/bin/sh
set -eu
mkdir -p '.'
cat > 'package.json' <<'BEHAVIORBENCH_1'
{
  "scripts": {"check": "bun test ./src"}
}
BEHAVIORBENCH_1
