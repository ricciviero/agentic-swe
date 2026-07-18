#!/bin/sh
set -eu
mkdir -p '.'
cat > 'regions.csv' <<'BEHAVIORBENCH_1'
name,enabled
rome,true
BEHAVIORBENCH_1
