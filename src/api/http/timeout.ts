/**
 * AbortController wiring.
 *
 * Introduced by arc PERF: `GET /v1/settlements/:batchId/items` needs a 30s read timeout
 * (`LONG_READ_TIMEOUT_MS`) because the ledger's own read timeout for `listSettlementItems` is
 * 30s (api-surface.md §11), while every other route stays at 10s. Before this module the
 * console used one global timeout and the settlement item list aborted client-side while the
 * server was still happily streaming.
 */
import { LONG_READ_TIMEOUT_MS, READ_TIMEOUT_MS } from '@config/constants';

export interface TimeoutHandle {
  signal: AbortSignal;
  /** Clears the timer. Must be called in a `finally`, or the tab leaks a timer per request. */
  dispose: () => void;
  /** True once the timer fired; distinguishes an abort we caused from a user navigation. */
  timedOut: () => boolean;
}

/** Routes whose read timeout is not `READ_TIMEOUT_MS`. Matched by prefix on the spec path. */
const LONG_READ_PATH_PATTERNS: ReadonlyArray<RegExp> = [
  /^\/settlements\/[^/]+\/items$/,
  /^\/reporting\/balance-history$/,
];
