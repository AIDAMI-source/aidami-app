import {
  countPendingSyncItems,
  getDatabase,
  listPendingSyncItems,
  markSyncItemFailed,
  removeSyncItem,
} from '../db';
import type { SyncActionType, SyncQueueItem } from '../types/models';

import { computeNextAttemptAt } from './backoff';
import { getSyncTransport } from './config';
import type { FlushSyncResult, SyncMutation, SyncTransport } from './types';

let flushInFlight: Promise<FlushSyncResult> | null = null;

function toMutation(row: SyncQueueItem): SyncMutation {
  let payload: unknown = row.payload_json;
  try {
    payload = JSON.parse(row.payload_json) as unknown;
  } catch {
    // Keep raw string if payload is not valid JSON.
  }
  return {
    id: row.id,
    targetTable: row.target_table,
    recordId: row.record_id,
    actionType: row.action_type as SyncActionType,
    payload,
    createdAt: row.created_at,
    attempts: row.attempts ?? 0,
  };
}

/**
 * Drain `sync_queue` in FIFO order via the active SyncTransport.
 * Concurrent callers share one in-flight flush.
 */
export async function flushSyncQueue(options?: {
  transport?: SyncTransport;
  limit?: number;
}): Promise<FlushSyncResult> {
  if (flushInFlight) {
    return flushInFlight;
  }

  flushInFlight = runFlush(options).finally(() => {
    flushInFlight = null;
  });
  return flushInFlight;
}

async function runFlush(options?: {
  transport?: SyncTransport;
  limit?: number;
}): Promise<FlushSyncResult> {
  const transport = options?.transport ?? getSyncTransport();
  const db = await getDatabase();
  const pending = await listPendingSyncItems(db, options?.limit ?? 50);

  const result: FlushSyncResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    pendingRemaining: 0,
    transport: transport.name,
    errors: [],
  };

  for (const row of pending) {
    result.processed += 1;
    const mutation = toMutation(row);

    try {
      const pushResult = await transport.push(mutation);
      if (pushResult.ok) {
        await removeSyncItem(db, row.id);
        result.succeeded += 1;
        continue;
      }

      const retryable = pushResult.retryable !== false;
      if (!retryable) {
        result.skipped += 1;
        result.errors.push(`#${row.id}: ${pushResult.error} (non-retryable)`);
        // Leave row in queue but push far ahead so it does not block forever.
        const far = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await markSyncItemFailed(db, row.id, pushResult.error, far);
        result.failed += 1;
        continue;
      }

      const attemptsAfter = (row.attempts ?? 0) + 1;
      const nextAt = computeNextAttemptAt(attemptsAfter);
      await markSyncItemFailed(db, row.id, pushResult.error, nextAt);
      result.failed += 1;
      result.errors.push(`#${row.id}: ${pushResult.error}`);
      // Stop the batch on first retryable failure to preserve FIFO order.
      break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const attemptsAfter = (row.attempts ?? 0) + 1;
      const nextAt = computeNextAttemptAt(attemptsAfter);
      await markSyncItemFailed(db, row.id, message, nextAt);
      result.failed += 1;
      result.errors.push(`#${row.id}: ${message}`);
      break;
    }
  }

  result.pendingRemaining = await countPendingSyncItems(db);
  return result;
}

/** Snapshot of how many mutations still wait for push. */
export async function getSyncQueueDepth(): Promise<number> {
  const db = await getDatabase();
  return countPendingSyncItems(db);
}
