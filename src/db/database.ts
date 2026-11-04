import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';
import { EXPECTED_TABLES, SCHEMA_SQL } from './schema';

const DB_NAME = 'aidami.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let schemaReady = false;

export type DbInitResult = {
  ok: boolean;
  tables: string[];
  seed?: {
    seeded: boolean;
    householdId: string;
    userId: string;
    careRecipientId: string;
  };
  error?: string;
};

async function openDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

/**
 * Opens the local SQLite database, applies the Aid'Ami schema,
 * and seeds a demo foyer when empty.
 */
export async function initializeDatabase(): Promise<DbInitResult> {
  try {
    const db = await openDb();
    await db.execAsync(SCHEMA_SQL);
    await runMigrations(db);
    schemaReady = true;

    const rows = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    );
    const tables = rows.map((row) => row.name);
    const missing = EXPECTED_TABLES.filter((name) => !tables.includes(name));

    if (missing.length > 0) {
      return {
        ok: false,
        tables,
        error: `Tables manquantes: ${missing.join(', ')}`,
      };
    }

    // Dynamic import avoids a circular dependency with seed.ts → getDatabase.
    const { seedIfEmpty } = await import('./seed');
    const seed = await seedIfEmpty();
    return { ok: true, tables, seed };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, tables: [], error: message };
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await openDb();
  if (!schemaReady) {
    await db.execAsync(SCHEMA_SQL);
    await runMigrations(db);
    schemaReady = true;
  }
  return db;
}
