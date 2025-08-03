/**
 * Tuning constants. Values that are the same in every environment live here; anything that
 * differs per environment is a `VITE_*` var in `env.ts`.
 *
 * The settlement numbers in this file are arc PERF: PAY-1996 dropped the item page size from
 * 500 to 50 and gave that one route its own read timeout, because a 500-row item page made
 * payzeno-api seq-scan and time out at the default 10s.
 */

/** Default page size for every list route that does not override it. */
export const DEFAULT_PAGE_SIZE = 25;

/** WebSocket reconnect backoff schedule, milliseconds. Jittered by `NotificationSocket`. */
export const WS_BACKOFF_MS: ReadonlyArray<number> = [500, 1_000, 2_000, 5_000, 10_000, 30_000];

/** Heartbeat ping interval. payzeno-api's gateway drops idle sockets at 60s. */
export const WS_HEARTBEAT_MS = 25_000;

