#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_V3_1'
export const windowSlice = <T>(values: T[], start: number, size: number) => size <= 0 ? [] : values.slice(Math.max(0, start), Math.max(0, start) + size);
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/value.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { windowSlice } from './value';
test('window bounds', () => { expect(windowSlice([1,2,3], -2, 2)).toEqual([1,2]); expect(windowSlice([1], 0, 0)).toEqual([]); });
BEHAVIORBENCH_V3_2
