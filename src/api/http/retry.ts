/**
 * Transport-level retry policy.
 *
 * Distinct from TanStack Query's retry (`app/QueryProvider.tsx`), which retries a whole
 * *query*. This one retries a single HTTP attempt while reusing the same idempotency key, so
 * payzeno-api replays rather than re-executes. That distinction is why `retryOn` may include
 * POST at all.
 */
import type { HttpMethod } from '../transport';

import { NetworkError } from './fetch-transport';
import { RequestTimeoutError } from './timeout';

/** Idempotent by HTTP semantics. POST is added per-call when the key makes it safe. */
const IDEMPOTENT_METHODS: ReadonlySet<HttpMethod> = new Set<HttpMethod>(['GET', 'DELETE']);

export const RETRYABLE_STATUSES: ReadonlyArray<number> = [502, 503, 504];

export interface RetryDecision {
  retry: boolean;
  delayMs: number;
  reason: string;
}

export interface RetryPolicyOptions {
  maxAttempts: number;
  baseDelayMs: number;
  method: HttpMethod;
  /** True when the request carries an `Idempotency-Key`; makes POST/PATCH safe to repeat. */
  hasIdempotencyKey: boolean;
  noRetry?: boolean;
}

function backoff(attempt: number, baseDelayMs: number): number {
  const exponential = baseDelayMs * 2 ** (attempt - 1);
  // Full jitter. Without it every open console tab retries the same 503 in lockstep.
  return Math.round(exponential * (0.5 + Math.random() * 0.5));
}

export function isSafeToRepeat(options: RetryPolicyOptions): boolean {
  if (options.noRetry) return false;
  if (IDEMPOTENT_METHODS.has(options.method)) return true;
  return options.hasIdempotencyKey;
}

/**
 * Decides whether attempt `attempt` (1-based) should be followed by another. A timeout
 * carries no status code and is exactly the case that most needs a retry — a predicate of
 * "502/503/504" alone never fires on it (api-surface.md §11 makes the same point about
 * `LedgerHttpClient`).
 */
export function decideRetry(
  err: unknown,
  attempt: number,
  options: RetryPolicyOptions,
): RetryDecision {
  const noMore = { retry: false, delayMs: 0 };

  if (attempt >= options.maxAttempts) {
    return { ...noMore, reason: 'attempts exhausted' };
  }
  if (!isSafeToRepeat(options)) {
    return { ...noMore, reason: `${options.method} is not safe to repeat` };
  }

  if (err instanceof RequestTimeoutError) {
    return { retry: true, delayMs: backoff(attempt, options.baseDelayMs), reason: 'read timeout' };
  }
  if (err instanceof NetworkError) {
    return { retry: true, delayMs: backoff(attempt, options.baseDelayMs), reason: 'network error' };
  }

  const status = (err as { status?: number }).status;
  if (typeof status === 'number' && RETRYABLE_STATUSES.includes(status)) {
    return { retry: true, delayMs: backoff(attempt, options.baseDelayMs), reason: `status ${status}` };
  }

  return { ...noMore, reason: 'not retryable' };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
