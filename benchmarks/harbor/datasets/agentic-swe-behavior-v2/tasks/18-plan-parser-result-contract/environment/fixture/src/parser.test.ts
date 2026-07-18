import { expect, test } from 'bun:test';
import { doubled } from './use-parser';
test('double', () => expect(doubled('3')).toBe(6));
