import type { SyncMutation, SyncPushResult, SyncTransport } from '../types';

/**
 * Logs each mutation then acknowledges success (no network).
 * Default transport while there is no real cloud backend.
 */
export class LogTransport implements SyncTransport {
  readonly name = 'log';

  async push(mutation: SyncMutation): Promise<SyncPushResult> {
    console.log(
      `[Aid'Ami sync/${this.name}] ${mutation.actionType} ${mutation.targetTable}#${mutation.recordId}`,
      mutation.payload,
    );
    return { ok: true };
  }
}

export const logTransport = new LogTransport();
