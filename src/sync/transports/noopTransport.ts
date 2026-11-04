import type { SyncMutation, SyncPushResult, SyncTransport } from '../types';

/**
 * Acknowledges every mutation without contacting a backend.
 * Use when the app runs fully offline / without cloud credentials —
 * the queue drains so it does not grow forever.
 */
export class NoopTransport implements SyncTransport {
  readonly name = 'noop';

  async push(_mutation: SyncMutation): Promise<SyncPushResult> {
    return { ok: true };
  }
}

export const noopTransport = new NoopTransport();
