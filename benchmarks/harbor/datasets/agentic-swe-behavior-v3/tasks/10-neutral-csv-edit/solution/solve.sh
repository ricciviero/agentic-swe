#!/bin/sh
set -eu
mkdir -p '.'
cat > 'regions.csv' <<'BEHAVIORBENCH_V3_1'
name,enabled
rome,true
BEHAVIORBENCH_V3_1
