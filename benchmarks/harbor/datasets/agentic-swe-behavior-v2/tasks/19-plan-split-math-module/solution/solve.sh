#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/sum.ts' <<'BEHAVIORBENCH_1'
export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/average.ts' <<'BEHAVIORBENCH_2'
import { sum } from './sum';
export const average = (values: number[]) => values.length ? sum(values) / values.length : 0;
BEHAVIORBENCH_2
mkdir -p 'src'
cat > 'src/index.ts' <<'BEHAVIORBENCH_3'
export { sum } from './sum';
export { average } from './average';
BEHAVIORBENCH_3
mkdir -p 'src'
cat > 'src/math.test.ts' <<'BEHAVIORBENCH_4'
import { expect, test } from 'bun:test';
import { average, sum } from './index';
test('public math', () => { expect(sum([1,2])).toBe(3); expect(average([2,4])).toBe(3); });
BEHAVIORBENCH_4
