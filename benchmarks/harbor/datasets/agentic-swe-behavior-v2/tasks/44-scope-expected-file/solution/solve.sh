#!/bin/sh
set -eu
mkdir -p 'tests'
cat > 'tests/expected.txt' <<'BEHAVIORBENCH_1'
new-result
BEHAVIORBENCH_1
