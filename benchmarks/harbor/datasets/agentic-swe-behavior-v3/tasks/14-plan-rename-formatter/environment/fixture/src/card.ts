import { formatUser } from './user';
export const card = (name: string) => `[${formatUser(name)}]`;
