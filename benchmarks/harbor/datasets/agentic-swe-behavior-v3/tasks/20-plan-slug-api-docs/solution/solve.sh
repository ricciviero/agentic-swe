#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/text.ts' <<'BEHAVIORBENCH_V3_1'
export const upper = (value: string) => value.toUpperCase();
export const slugify = (value: string) => value.normalize('NFKD').replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase();
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/text.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { slugify, upper } from './text';
test('upper', () => expect(upper('a')).toBe('A'));
test('slug', () => expect(slugify(' Hello, World! ')).toBe('hello-world'));
BEHAVIORBENCH_V3_2
mkdir -p '.'
cat > 'README.md' <<'BEHAVIORBENCH_V3_3'
# Text helpers

`slugify('Hello, World!')` returns `hello-world`.
BEHAVIORBENCH_V3_3
