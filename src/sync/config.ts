import type { SyncTransport } from './types';
import { logTransport } from './transports/logTransport';

/**
 * Active push transport. Default: LogTransport (no cloud keys).
 *
 * To plug Supabase later:
 * - implement `SupabaseTransport` (see `transports/supabaseTransport.stub.ts`)
 * - `setSyncTransport(createSupabaseTransportFromEnv() ?? logTransport)`
 */
let activeTransport: SyncTransport = logTransport;

export function getSyncTransport(): SyncTransport {
  return activeTransport;
}

export function setSyncTransport(transport: SyncTransport): void {
  activeTransport = transport;
}
