#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/double.ts' <<'BEHAVIORBENCH_1'
export const double = (value: number) => value * 2;
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/double.test.ts' <<'BEHAVIORBENCH_2'
import { expect, test } from 'bun:test';
test('fixture boots', () => expect(true).toBe(true));
BEHAVIORBENCH_2
