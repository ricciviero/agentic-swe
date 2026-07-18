#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_V3_1'
export const parsePort = (value: string) => { const port=Number(value); if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('invalid port'); return port; };
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/value.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { parsePort } from './value';
test('port range', () => { expect(parsePort('8080')).toBe(8080); expect(() => parsePort('70000')).toThrow(); });
BEHAVIORBENCH_V3_2
