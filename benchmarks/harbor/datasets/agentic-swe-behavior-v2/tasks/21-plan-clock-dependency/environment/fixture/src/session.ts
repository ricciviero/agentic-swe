import { isExpired } from './expires';
export const active = (expiresAt: number) => !isExpired(expiresAt);
