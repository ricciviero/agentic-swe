#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/sum.ts' <<'BEHAVIORBENCH_V3_1'
export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/average.ts' <<'BEHAVIORBENCH_V3_2'
import { sum } from './sum';
export const average = (values: number[]) => values.length ? sum(values) / values.length : 0;
BEHAVIORBENCH_V3_2
mkdir -p 'src'
cat > 'src/index.ts' <<'BEHAVIORBENCH_V3_3'
export { sum } from './sum';
export { average } from './average';
BEHAVIORBENCH_V3_3
mkdir -p 'src'
cat > 'src/math.test.ts' <<'BEHAVIORBENCH_V3_4'
import { expect, test } from 'bun:test';
import { average, sum } from './index';
test('public math', () => { expect(sum([1,2])).toBe(3); expect(average([2,4])).toBe(3); });
BEHAVIORBENCH_V3_4
