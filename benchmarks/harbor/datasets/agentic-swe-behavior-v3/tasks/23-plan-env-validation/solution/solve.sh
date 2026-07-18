#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/env.ts' <<'BEHAVIORBENCH_V3_1'
export const loadPort = (value: string | undefined) => {
  if (value === undefined) throw new Error('PORT is required');
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT is invalid');
  return port;
};
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/env.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { loadPort } from './env';
test('valid', () => expect(loadPort('4000')).toBe(4000));
test('required', () => expect(() => loadPort(undefined)).toThrow());
test('integer range', () => { expect(() => loadPort('3.5')).toThrow(); expect(() => loadPort('70000')).toThrow(); });
BEHAVIORBENCH_V3_2
