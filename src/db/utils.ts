import * as Crypto from 'expo-crypto';

/** ISO-8601 UTC timestamp for SQLite TEXT columns. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** UUID v4 via expo-crypto (works on device + Expo Go). */
export function newId(): string {
  return Crypto.randomUUID();
}
