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

