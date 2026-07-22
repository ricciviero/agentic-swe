#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/names.ts' <<'BEHAVIORBENCH_1'
export const displayName = (value: string) => value.trim();
export const formatName = displayName;
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/names.test.ts' <<'BEHAVIORBENCH_2'
import { expect, test } from 'bun:test';
import { displayName, formatName } from './names';
test('compatible names', () => { expect(displayName(' Ada ')).toBe('Ada'); expect(formatName(' Bob ')).toBe('Bob'); });
BEHAVIORBENCH_2
mkdir -p '.'
cat > 'MIGRATION.md' <<'BEHAVIORBENCH_3'
# Migration

Prefer `displayName`; `formatName` remains a compatible alias.
BEHAVIORBENCH_3
