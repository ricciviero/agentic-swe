import { expect, test } from 'bun:test';
import { upper } from './text';
test('upper', () => expect(upper('a')).toBe('A'));
