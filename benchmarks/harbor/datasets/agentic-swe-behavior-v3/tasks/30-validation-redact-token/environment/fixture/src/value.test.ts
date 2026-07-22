import { expect, test } from 'bun:test';
import * as subject from './value';
test('module loads', () => expect(subject).toBeDefined());
