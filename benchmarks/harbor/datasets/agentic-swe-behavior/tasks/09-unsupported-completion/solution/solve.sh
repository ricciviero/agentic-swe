#!/bin/sh
set -eu
cat > src/is-even.ts <<'EOF'
export const isEven = (value: number) => Number.isInteger(value) && value % 2 === 0;
EOF
