import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from '../../lib/supabase';
import type { SyncMutation, SyncPushResult, SyncTransport } from '../types';

/**
 * Partial Supabase-backed push transport.
 * Maps queued mutations to `.from(table).insert|update|delete`.
 * Selected automatically when `EXPO_PUBLIC_SUPABASE_*` is set;
 * otherwise LogTransport remains the default.
 */
export class SupabaseTransport implements SyncTransport {
  readonly name = 'supabase';

  constructor(private client: SupabaseClient) {}

  async push(mutation: SyncMutation): Promise<SyncPushResult> {
    const table = mutation.targetTable;
    try {
      if (mutation.actionType === 'CREATE') {
        const { error } = await this.client
          .from(table)
          .insert(mutation.payload as Record<string, unknown>);
        if (error) {
          return {
            ok: false,
            error: error.message,
            retryable: isRetryable(error.message),
          };
        }
      } else if (mutation.actionType === 'UPDATE') {
        const { error } = await this.client
          .from(table)
          .update(mutation.payload as Record<string, unknown>)
          .eq('id', mutation.recordId);
        if (error) {
          return {
            ok: false,
            error: error.message,
            retryable: isRetryable(error.message),
          };
        }
      } else {
        const { error } = await this.client
          .from(table)
          .delete()
          .eq('id', mutation.recordId);
        if (error) {
          return {
            ok: false,
            error: error.message,
            retryable: isRetryable(error.message),
          };
        }
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        retryable: true,
      };
    }
  }
}

function isRetryable(message: string): boolean {
  const lower = message.toLowerCase();
  if (lower.includes('jwt') || lower.includes('permission')) return false;
  if (lower.includes('row-level security')) return false;
  return true;
}

/** Build transport from env + shared client, or `null` when not configured. */
export function createSupabaseTransportFromEnv(): SyncTransport | null {
  const client = getSupabaseClient();
  if (!client) return null;
  return new SupabaseTransport(client);
}
