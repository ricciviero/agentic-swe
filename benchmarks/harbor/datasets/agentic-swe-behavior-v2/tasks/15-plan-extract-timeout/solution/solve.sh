#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/constants.ts' <<'BEHAVIORBENCH_1'
export const DEFAULT_TIMEOUT_MS = 5000;
BEHAVIORBENCH_1
mkdir -p 'src'
cat > 'src/http.ts' <<'BEHAVIORBENCH_2'
import { DEFAULT_TIMEOUT_MS } from './constants';
export const httpTimeout = () => DEFAULT_TIMEOUT_MS;
BEHAVIORBENCH_2
mkdir -p 'src'
cat > 'src/queue.ts' <<'BEHAVIORBENCH_3'
import { DEFAULT_TIMEOUT_MS } from './constants';
export const queueTimeout = () => DEFAULT_TIMEOUT_MS;
BEHAVIORBENCH_3
mkdir -p 'src'
cat > 'src/timeouts.test.ts' <<'BEHAVIORBENCH_4'
import { expect, test } from 'bun:test';
import { httpTimeout } from './http';
import { queueTimeout } from './queue';
test('shared timeout', () => { expect(httpTimeout()).toBe(5000); expect(queueTimeout()).toBe(5000); });
BEHAVIORBENCH_4
