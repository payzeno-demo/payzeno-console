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
