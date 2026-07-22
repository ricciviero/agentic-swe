import { expect, test } from 'bun:test';
import { isExpired } from './expires';
test('past', () => expect(isExpired(0)).toBe(true));
