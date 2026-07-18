import { expect, test } from 'bun:test';
import { isEven } from './is-even';
test('positive', () => expect(isEven(4)).toBe(true));
test('negative', () => expect(isEven(-4)).toBe(true));
