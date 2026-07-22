#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_V3_1'
export const divide = (a: number, b: number) => { if (b === 0) throw new Error('division by zero'); return a / b; };
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/value.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { divide } from './value';
test('zero divisor', () => expect(() => divide(1, 0)).toThrow());
BEHAVIORBENCH_V3_2
