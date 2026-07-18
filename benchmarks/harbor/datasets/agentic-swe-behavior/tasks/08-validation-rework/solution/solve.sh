#!/bin/sh
set -eu
cat > src/divide.ts <<'EOF'
export const divide = (a: number, b: number) => {
  if (b === 0) throw new Error('division by zero');
  return a / b;
};
EOF
