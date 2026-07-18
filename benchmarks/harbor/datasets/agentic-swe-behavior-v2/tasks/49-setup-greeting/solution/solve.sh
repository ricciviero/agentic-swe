#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/greet.ts' <<'BEHAVIORBENCH_1'
export const greet = (name: string) => `Hello, ${name}!`;
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/greet.test.ts' <<'BEHAVIORBENCH_2'
import { expect, test } from 'bun:test';
test('fixture boots', () => expect(true).toBe(true));
BEHAVIORBENCH_2
