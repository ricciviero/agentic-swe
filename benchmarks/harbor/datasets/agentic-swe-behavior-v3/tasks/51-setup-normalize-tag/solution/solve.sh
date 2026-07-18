#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/tag.ts' <<'BEHAVIORBENCH_V3_1'
export const normalizeTag = (value: string) => value.trim().toLowerCase();
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/tag.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { normalizeTag } from './tag';
test('tag', () => expect(normalizeTag(' News ')).toBe('news'));
BEHAVIORBENCH_V3_2
