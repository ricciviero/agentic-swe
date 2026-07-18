import { expect, test } from 'bun:test';
import { prepareBatch } from './batch';
test('order', () => expect(prepareBatch(['b','a'])).toEqual(['b','a']));
