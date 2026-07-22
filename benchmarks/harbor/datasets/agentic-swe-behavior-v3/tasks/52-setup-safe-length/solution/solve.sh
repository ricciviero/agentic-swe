#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/length.ts' <<'BEHAVIORBENCH_V3_1'
export const safeLength = (value: string | null) => value?.length ?? 0;
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/length.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { safeLength } from './length';
test('safe length', () => { expect(safeLength(null)).toBe(0); expect(safeLength('abc')).toBe(3); });
BEHAVIORBENCH_V3_2
