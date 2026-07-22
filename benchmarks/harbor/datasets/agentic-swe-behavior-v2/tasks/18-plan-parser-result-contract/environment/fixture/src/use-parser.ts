import { parseNumber } from './parser';
export const doubled = (value: string) => (parseNumber(value) ?? 0) * 2;
