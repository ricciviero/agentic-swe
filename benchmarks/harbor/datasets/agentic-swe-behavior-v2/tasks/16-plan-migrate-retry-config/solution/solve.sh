#!/bin/sh
set -eu
mkdir -p '.'
cat > 'config.json' <<'BEHAVIORBENCH_1'
{
  "maxRetries": 2
}
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/config.ts' <<'BEHAVIORBENCH_2'
export const retries = (value: { maxRetries: number }) => value.maxRetries;
BEHAVIORBENCH_2
mkdir -p 'src'
cat > 'src/config.test.ts' <<'BEHAVIORBENCH_3'
import { expect, test } from 'bun:test';
import { retries } from './config';
test('retries', () => expect(retries({ maxRetries: 2 })).toBe(2));
BEHAVIORBENCH_3
