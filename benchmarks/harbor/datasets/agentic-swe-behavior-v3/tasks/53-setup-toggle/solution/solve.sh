#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/toggle.ts' <<'BEHAVIORBENCH_V3_1'
export const toggle = (value: boolean) => !value;
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/toggle.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { toggle } from './toggle';
test('toggle', () => { expect(toggle(false)).toBe(true); expect(toggle(true)).toBe(false); });
BEHAVIORBENCH_V3_2
