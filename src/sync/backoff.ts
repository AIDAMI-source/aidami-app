/** Base delay (ms) before the first retry after a failed push. */
export const SYNC_BACKOFF_BASE_MS = 5_000;

/** Cap so a flaky network does not schedule days ahead. */
export const SYNC_BACKOFF_MAX_MS = 15 * 60 * 1000;

/**
 * Exponential backoff: base * 2^(attempts-1), capped.
 * `attempts` is the count *after* the failure that just happened (1-based).
 */
export function computeNextAttemptAt(
  attemptsAfterFailure: number,
  nowMs = Date.now(),
): string {
  const exp = Math.max(0, attemptsAfterFailure - 1);
  const delay = Math.min(
    SYNC_BACKOFF_MAX_MS,
    SYNC_BACKOFF_BASE_MS * 2 ** exp,
  );
  return new Date(nowMs + delay).toISOString();
}
