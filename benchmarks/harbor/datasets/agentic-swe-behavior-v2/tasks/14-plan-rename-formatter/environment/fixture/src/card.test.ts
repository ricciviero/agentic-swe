import { expect, test } from 'bun:test';
import { card } from './card';
test('card', () => expect(card(' Ada ')).toBe('[Ada]'));
