export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
export const average = (values: number[]) => sum(values) / values.length;
