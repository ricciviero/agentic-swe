#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/double.ts' <<'BEHAVIORBENCH_V3_1'
export const double = (value: number) => value * 2;
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/double.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { double } from './double';
test('double', () => expect(double(4)).toBe(8));
BEHAVIORBENCH_V3_2
