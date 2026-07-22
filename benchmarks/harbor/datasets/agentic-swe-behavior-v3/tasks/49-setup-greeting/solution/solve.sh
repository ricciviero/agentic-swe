#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/greet.ts' <<'BEHAVIORBENCH_V3_1'
export const greet = (name: string) => `Hello, ${name}!`;
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/greet.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { greet } from './greet';
test('greeting', () => expect(greet('Ada')).toBe('Hello, Ada!'));
BEHAVIORBENCH_V3_2
