#!/bin/sh
set -eu
mkdir -p 'css'
cat > 'css/theme.css' <<'BEHAVIORBENCH_1'
:root { --accent: green; }
BEHAVIORBENCH_1
