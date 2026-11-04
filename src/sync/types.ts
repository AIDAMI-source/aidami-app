import type { SyncActionType } from '../types/models';

/** One queued local mutation ready for a SyncTransport. */
export type SyncMutation = {
  id: number;
  targetTable: string;
  recordId: string;
  actionType: SyncActionType;
  payload: unknown;
  createdAt: string;
  attempts: number;
};

export type SyncPushResult =
  | { ok: true }
  | { ok: false; error: string; retryable?: boolean };

/**
 * Pluggable push backend. Swap Noop/Log/Memory for a future
 * SupabaseTransport (or any HTTP API) without changing the worker.
 */
export interface SyncTransport {
  readonly name: string;
  push(mutation: SyncMutation): Promise<SyncPushResult>;
}

export type FlushSyncResult = {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  pendingRemaining: number;
  transport: string;
  errors: string[];
};
