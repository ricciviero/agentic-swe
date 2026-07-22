#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/length.ts' <<'BEHAVIORBENCH_1'
export const safeLength = (value: string | null) => value?.length ?? 0;
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/length.test.ts' <<'BEHAVIORBENCH_2'
import { expect, test } from 'bun:test';
test('fixture boots', () => expect(true).toBe(true));
BEHAVIORBENCH_2
