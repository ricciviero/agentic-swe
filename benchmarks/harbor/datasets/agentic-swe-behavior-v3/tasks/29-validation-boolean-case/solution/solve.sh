#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_V3_1'
export const parseBoolean = (value: string) => { const normalized=value.toLowerCase(); if (normalized==='true') return true; if (normalized==='false') return false; throw new Error('invalid boolean'); };
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/value.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { parseBoolean } from './value';
test('boolean parser', () => { expect(parseBoolean('TRUE')).toBe(true); expect(parseBoolean('FALSE')).toBe(false); expect(() => parseBoolean('yes')).toThrow(); });
BEHAVIORBENCH_V3_2
