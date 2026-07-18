#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/first.ts' <<'BEHAVIORBENCH_1'
export const first = <T>(values: T[]) => values[0] ?? null;
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/first.test.ts' <<'BEHAVIORBENCH_2'
import { expect, test } from 'bun:test';
test('fixture boots', () => expect(true).toBe(true));
BEHAVIORBENCH_2
