import { expect, test } from 'bun:test';
import { retries } from './config';
test('retries', () => expect(retries({ retryCount: 2 })).toBe(2));
