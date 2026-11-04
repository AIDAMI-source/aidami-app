import type { SyncMutation, SyncPushResult, SyncTransport } from '../types';

/**
 * Stub for a future Supabase-backed transport.
 *
 * Plug-in outline (do not require keys today):
 * 1. `npx expo install @supabase/supabase-js`
 * 2. Read `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
 * 3. Map `mutation.targetTable` / `actionType` to `.from(table).insert|update|delete`
 * 4. Wire it in `src/sync/config.ts` instead of LogTransport
 *
 * Example skeleton:
 *
 * ```ts
 * import { createClient, type SupabaseClient } from '@supabase/supabase-js';
 *
 * export class SupabaseTransport implements SyncTransport {
 *   readonly name = 'supabase';
 *   constructor(private client: SupabaseClient) {}
 *
 *   async push(mutation: SyncMutation): Promise<SyncPushResult> {
 *     const table = mutation.targetTable;
 *     try {
 *       if (mutation.actionType === 'CREATE') {
 *         const { error } = await this.client.from(table).insert(mutation.payload);
 *         if (error) return { ok: false, error: error.message, retryable: true };
 *       } else if (mutation.actionType === 'UPDATE') {
 *         const { error } = await this.client
 *           .from(table)
 *           .update(mutation.payload)
 *           .eq('id', mutation.recordId);
 *         if (error) return { ok: false, error: error.message, retryable: true };
 *       } else {
 *         const { error } = await this.client
 *           .from(table)
 *           .delete()
 *           .eq('id', mutation.recordId);
 *         if (error) return { ok: false, error: error.message, retryable: true };
 *       }
 *       return { ok: true };
 *     } catch (err) {
 *       return {
 *         ok: false,
 *         error: err instanceof Error ? err.message : String(err),
 *         retryable: true,
 *       };
 *     }
 *   }
 * }
 *
 * export function createSupabaseTransportFromEnv(): SyncTransport | null {
 *   const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
 *   const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
 *   if (!url || !key) return null;
 *   return new SupabaseTransport(createClient(url, key));
 * }
 * ```
 */
export class SupabaseTransportStub implements SyncTransport {
  readonly name = 'supabase-stub';

  async push(_mutation: SyncMutation): Promise<SyncPushResult> {
    return {
      ok: false,
      error:
        'SupabaseTransport not implemented — set EXPO_PUBLIC_SUPABASE_* and replace LogTransport in src/sync/config.ts',
      retryable: false,
    };
  }
}
