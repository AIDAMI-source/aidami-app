import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Idempotent schema upgrades for existing Aid'Ami databases.
 * CREATE TABLE IF NOT EXISTS does not add columns to older tables.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await migrateSyncQueue(db);
}

async function migrateSyncQueue(db: SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(sync_queue)`,
  );
  const names = new Set(cols.map((col) => col.name));

  if (!names.has('attempts')) {
    await db.execAsync(
      `ALTER TABLE sync_queue ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0`,
    );
  }
  if (!names.has('last_error')) {
    await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN last_error TEXT`);
  }
  if (!names.has('next_attempt_at')) {
    await db.execAsync(
      `ALTER TABLE sync_queue ADD COLUMN next_attempt_at TEXT`,
    );
  }
}
