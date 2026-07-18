#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/batch.ts' <<'BEHAVIORBENCH_V3_1'
export const prepareBatch = (ids: string[]) => [...new Set(ids)];
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/batch.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { prepareBatch } from './batch';
test('stable unique', () => expect(prepareBatch(['b','a','b'])).toEqual(['b','a']));
BEHAVIORBENCH_V3_2
mkdir -p 'docs'
cat > 'docs/batch.md' <<'BEHAVIORBENCH_V3_3'
# Batch

Duplicate IDs are removed while preserving first-seen input order.
BEHAVIORBENCH_V3_3
