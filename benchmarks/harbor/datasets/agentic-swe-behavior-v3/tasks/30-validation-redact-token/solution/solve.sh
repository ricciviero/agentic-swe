#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_V3_1'
export const redactToken = (value: string) => value.length <= 4 ? '****' : '*'.repeat(value.length - 4) + value.slice(-4);
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/value.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { redactToken } from './value';
test('token redaction', () => { expect(redactToken('abcdefghijkl')).toBe('********ijkl'); expect(redactToken('abc')).toBe('****'); });
BEHAVIORBENCH_V3_2
