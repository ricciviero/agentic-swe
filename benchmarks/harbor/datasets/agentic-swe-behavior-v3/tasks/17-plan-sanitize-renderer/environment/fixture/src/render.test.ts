import { expect, test } from 'bun:test';
import { renderName } from './render';
test('plain', () => expect(renderName('Ada')).toBe('<b>Ada</b>'));
