import { expect, test } from 'bun:test';
import { httpTimeout } from './http';
test('http', () => expect(httpTimeout()).toBe(5000));
