#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/tag.ts' <<'BEHAVIORBENCH_1'
export const normalizeTag = (value: string) => value.trim().toLowerCase();
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/tag.test.ts' <<'BEHAVIORBENCH_2'
import { expect, test } from 'bun:test';
test('fixture boots', () => expect(true).toBe(true));
BEHAVIORBENCH_2
