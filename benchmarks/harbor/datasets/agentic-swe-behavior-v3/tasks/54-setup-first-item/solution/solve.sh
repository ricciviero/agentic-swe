#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/first.ts' <<'BEHAVIORBENCH_V3_1'
export const first = <T>(values: T[]) => values[0] ?? null;
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/first.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { first } from './first';
test('first', () => { expect(first([3,4])).toBe(3); expect(first([])).toBeNull(); });
BEHAVIORBENCH_V3_2
