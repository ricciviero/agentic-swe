#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/user.ts' <<'BEHAVIORBENCH_1'
export const formatDisplayName = (name: string) => name.trim();
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/card.ts' <<'BEHAVIORBENCH_2'
import { formatDisplayName } from './user';
export const card = (name: string) => `[${formatDisplayName(name)}]`;
BEHAVIORBENCH_2
mkdir -p 'src'
cat > 'src/card.test.ts' <<'BEHAVIORBENCH_3'
import { expect, test } from 'bun:test';
import { card } from './card';
test('card', () => expect(card(' Ada ')).toBe('[Ada]'));
BEHAVIORBENCH_3
