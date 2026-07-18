#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/parser.ts' <<'BEHAVIORBENCH_V3_1'
export type ParseResult = { ok: true; value: number } | { ok: false; error: string };
export const parseNumber = (value: string): ParseResult => Number.isFinite(Number(value)) ? { ok: true, value: Number(value) } : { ok: false, error: 'invalid-number' };
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/use-parser.ts' <<'BEHAVIORBENCH_V3_2'
import { parseNumber } from './parser';
export const doubled = (value: string) => { const result = parseNumber(value); return result.ok ? result.value * 2 : 0; };
BEHAVIORBENCH_V3_2
mkdir -p 'src'
cat > 'src/parser.test.ts' <<'BEHAVIORBENCH_V3_3'
import { expect, test } from 'bun:test';
import { parseNumber } from './parser';
import { doubled } from './use-parser';
test('result contract', () => { expect(parseNumber('3')).toEqual({ ok: true, value: 3 }); expect(parseNumber('x')).toEqual({ ok: false, error: 'invalid-number' }); expect(doubled('3')).toBe(6); });
BEHAVIORBENCH_V3_3
