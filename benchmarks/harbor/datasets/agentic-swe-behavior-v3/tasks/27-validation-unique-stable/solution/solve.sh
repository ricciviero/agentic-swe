#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/value.ts' <<'BEHAVIORBENCH_V3_1'
export const uniqueValues = (values: string[]) => [...new Set(values)];
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/value.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { uniqueValues } from './value';
test('stable unique', () => expect(uniqueValues(['b','a','b'])).toEqual(['b','a']));
BEHAVIORBENCH_V3_2
