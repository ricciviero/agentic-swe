import { expect, test } from 'bun:test';
import { divide } from './divide';
test('divide', () => expect(divide(6, 2)).toBe(3));
test('zero', () => expect(() => divide(1, 0)).toThrow());
