import type { SyncMutation, SyncPushResult, SyncTransport } from '../types';

/**
 * Legacy stub retained for reference.
 * Prefer `supabaseTransport.ts` (`SupabaseTransport` + `createSupabaseTransportFromEnv`).
 * Wired automatically from `src/sync/config.ts` when env keys are present.
 */
export class SupabaseTransportStub implements SyncTransport {
  readonly name = 'supabase-stub';

  async push(_mutation: SyncMutation): Promise<SyncPushResult> {
    return {
      ok: false,
      error:
        'Use SupabaseTransport from supabaseTransport.ts — set EXPO_PUBLIC_SUPABASE_* env vars',
      retryable: false,
    };
  }
}
