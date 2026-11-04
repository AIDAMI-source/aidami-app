import type { SQLiteDatabase } from 'expo-sqlite';

import type { SyncActionType, SyncQueueItem } from '../types/models';

import { nowIso } from './utils';

/**
 * Enqueue a local mutation for later cloud sync.
 * Does not perform the mutation itself.
 */
export async function enqueueSync(
  db: SQLiteDatabase,
  targetTable: string,
  recordId: string,
  actionType: SyncActionType,
  payload: unknown,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_queue (
      target_table, record_id, action_type, payload_json, created_at,
      attempts, last_error, next_attempt_at
    ) VALUES (?, ?, ?, ?, ?, 0, NULL, NULL)`,
    targetTable,
    recordId,
    actionType,
    JSON.stringify(payload),
    nowIso(),
  );
}

/** Pending rows ready to push (respects backoff via next_attempt_at). */
export async function listPendingSyncItems(
  db: SQLiteDatabase,
  limit = 50,
): Promise<SyncQueueItem[]> {
  const now = nowIso();
  return db.getAllAsync<SyncQueueItem>(
    `SELECT * FROM sync_queue
     WHERE next_attempt_at IS NULL OR next_attempt_at <= ?
     ORDER BY id ASC
     LIMIT ?`,
    now,
    limit,
  );
}

export async function countPendingSyncItems(
  db: SQLiteDatabase,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM sync_queue`,
  );
  return row?.count ?? 0;
}

/** Remove a successfully synced row. */
export async function removeSyncItem(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, id);
}

/** Record a failed push and schedule the next retry. */
export async function markSyncItemFailed(
  db: SQLiteDatabase,
  id: number,
  error: string,
  nextAttemptAt: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE sync_queue
     SET attempts = attempts + 1,
         last_error = ?,
         next_attempt_at = ?
     WHERE id = ?`,
    error.slice(0, 500),
    nextAttemptAt,
    id,
  );
}
