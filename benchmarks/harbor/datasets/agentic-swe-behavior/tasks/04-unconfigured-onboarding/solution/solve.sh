#!/bin/sh
set -eu
mkdir -p src
cat > src/greet.ts <<'EOF'
export const greet = (name: string) => `Hello, ${name}!`;
EOF
cat > src/greet.test.ts <<'EOF'
import { expect, test } from 'bun:test';
import { greet } from './greet';
test('greet', () => expect(greet('Ada')).toBe('Hello, Ada!'));
EOF
