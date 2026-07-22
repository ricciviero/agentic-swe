#!/bin/sh
set -eu
mkdir -p 'css'
cat > 'css/theme.css' <<'BEHAVIORBENCH_V3_1'
:root { --accent: green; }
BEHAVIORBENCH_V3_1
