import { expect, test } from 'bun:test';
import { formatName } from './names';
test('format', () => expect(formatName(' Ada ')).toBe('Ada'));
