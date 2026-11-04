import type { SyncMutation, SyncPushResult, SyncTransport } from '../types';

export type MemoryTransportOptions = {
  /** When true, the next push fails (for backoff tests). */
  failNext?: boolean;
  /** Fail every push while true. */
  alwaysFail?: boolean;
};

/**
 * In-memory mock: stores acknowledged mutations for tests / demos.
 * No network, no credentials.
 */
export class MemoryTransport implements SyncTransport {
  readonly name = 'memory';
  readonly pushed: SyncMutation[] = [];
  private options: MemoryTransportOptions;

  constructor(options: MemoryTransportOptions = {}) {
    this.options = options;
  }

  setOptions(options: MemoryTransportOptions): void {
    this.options = { ...this.options, ...options };
  }

  clear(): void {
    this.pushed.length = 0;
  }

  async push(mutation: SyncMutation): Promise<SyncPushResult> {
    if (this.options.alwaysFail || this.options.failNext) {
      this.options = { ...this.options, failNext: false };
      return {
        ok: false,
        error: 'MemoryTransport simulated failure',
        retryable: true,
      };
    }
    this.pushed.push(mutation);
    return { ok: true };
  }
}

export function createMemoryTransport(
  options?: MemoryTransportOptions,
): MemoryTransport {
  return new MemoryTransport(options);
}
