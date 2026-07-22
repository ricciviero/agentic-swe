import { expect, test } from 'bun:test';
import { increment } from './counter';
test('increment', () => expect(increment(1)).toBe(2));
