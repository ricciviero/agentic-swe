#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/counter.ts' <<'BEHAVIORBENCH_1'
export const increment = (value: number) => value + 1;
export const decrement = (value: number) => value - 1;
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/counter.test.ts' <<'BEHAVIORBENCH_2'
import { expect, test } from 'bun:test';
import { decrement, increment } from './counter';
test('increment', () => expect(increment(1)).toBe(2));
test('decrement', () => expect(decrement(1)).toBe(0));
BEHAVIORBENCH_2
