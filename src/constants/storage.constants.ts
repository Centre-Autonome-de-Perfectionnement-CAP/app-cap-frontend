/**
 * Constantes pour le localStorage
 */

export const STORAGE_KEYS = {
  TOKEN: 'token',
  ROLE: 'role',
  NOM: 'nom',
  PRENOMS: 'prenoms',
  USER_ID: 'userId',
  EMAIL: 'email',
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;
