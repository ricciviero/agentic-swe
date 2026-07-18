#!/bin/sh
set -eu
mkdir -p 'src'
cat > 'src/render.ts' <<'BEHAVIORBENCH_V3_1'
const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export const renderName = (value: string) => `<b>${escapeHtml(value)}</b>`;
BEHAVIORBENCH_V3_1
mkdir -p 'src'
cat > 'src/render.test.ts' <<'BEHAVIORBENCH_V3_2'
import { expect, test } from 'bun:test';
import { renderName } from './render';
test('plain', () => expect(renderName('Ada')).toBe('<b>Ada</b>'));
test('escaped', () => expect(renderName('<A&B>')).toBe('<b>&lt;A&amp;B&gt;</b>'));
BEHAVIORBENCH_V3_2
