import { expect, test } from 'bun:test';
import { sum } from './index';
test('sum', () => expect(sum([1,2])).toBe(3));
