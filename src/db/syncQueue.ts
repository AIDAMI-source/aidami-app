import type { SQLiteDatabase } from 'expo-sqlite';

import type { SyncActionType } from '../types/models';

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
    `INSERT INTO sync_queue (target_table, record_id, action_type, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    targetTable,
    recordId,
    actionType,
    JSON.stringify(payload),
    nowIso(),
  );
}
