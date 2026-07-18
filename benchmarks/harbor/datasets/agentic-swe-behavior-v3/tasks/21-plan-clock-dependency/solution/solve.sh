#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/expires.ts' <<'BEHAVIORBENCH_V3_1'
export type Clock = { now(): number };
export const systemClock: Clock = { now: () => Date.now() };
export const isExpired = (timestamp: number, clock: Clock = systemClock) => timestamp <= clock.now();
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/session.ts' <<'BEHAVIORBENCH_V3_2'
import { isExpired, systemClock, type Clock } from './expires';
export const active = (expiresAt: number, clock: Clock = systemClock) => !isExpired(expiresAt, clock);
BEHAVIORBENCH_V3_2
mkdir -p 'src'
cat > 'src/expires.test.ts' <<'BEHAVIORBENCH_V3_3'
import { expect, test } from 'bun:test';
import { isExpired } from './expires';
import { active } from './session';
const clock = { now: () => 100 };
test('clock', () => { expect(isExpired(100, clock)).toBe(true); expect(active(101, clock)).toBe(true); });
BEHAVIORBENCH_V3_3
