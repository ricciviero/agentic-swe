import { expect, test } from 'bun:test';
import { displayName } from './names';
test('display', () => expect(displayName('Ada')).toBe('Ada'));
