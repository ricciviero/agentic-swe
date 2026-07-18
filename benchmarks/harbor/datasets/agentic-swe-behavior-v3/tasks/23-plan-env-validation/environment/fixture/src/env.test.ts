import { expect, test } from 'bun:test';
import { loadPort } from './env';
test('port', () => expect(loadPort('4000')).toBe(4000));
