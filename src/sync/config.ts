import type { SyncTransport } from './types';
import { logTransport } from './transports/logTransport';
import { createSupabaseTransportFromEnv } from './transports/supabaseTransport';

/**
 * Active push transport.
 * - Default / offline: LogTransport (no cloud keys)
 * - When `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set:
 *   SupabaseTransport is selected automatically
 *
 * Override anytime with `setSyncTransport(...)`.
 */
let activeTransport: SyncTransport =
  createSupabaseTransportFromEnv() ?? logTransport;

export function getSyncTransport(): SyncTransport {
  return activeTransport;
}

export function setSyncTransport(transport: SyncTransport): void {
  activeTransport = transport;
}

/** Re-resolve from env (e.g. after late config). Falls back to LogTransport. */
export function refreshSyncTransportFromEnv(): SyncTransport {
  activeTransport = createSupabaseTransportFromEnv() ?? logTransport;
  return activeTransport;
}
