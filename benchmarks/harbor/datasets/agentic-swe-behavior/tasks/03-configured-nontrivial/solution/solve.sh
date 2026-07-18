#!/bin/sh
set -eu
cat > src/counter.ts <<'EOF'
export const increment = (value: number) => value + 1;
export const decrement = (value: number) => value - 1;
EOF
cat > src/counter.test.ts <<'EOF'
import { expect, test } from 'bun:test';
import { decrement, increment } from './counter';
test('increment', () => expect(increment(1)).toBe(2));
test('decrement', () => expect(decrement(1)).toBe(0));
EOF
