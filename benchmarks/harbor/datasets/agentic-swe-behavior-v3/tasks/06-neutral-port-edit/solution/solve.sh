#!/bin/sh
set -eu
mkdir -p '.'
cat > 'server.conf' <<'BEHAVIORBENCH_V3_1'
port=4000
BEHAVIORBENCH_V3_1
