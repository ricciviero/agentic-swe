#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/toggle.ts' <<'BEHAVIORBENCH_1'
export const toggle = (value: boolean) => !value;
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/toggle.test.ts' <<'BEHAVIORBENCH_2'
import { expect, test } from 'bun:test';
test('fixture boots', () => expect(true).toBe(true));
BEHAVIORBENCH_2
