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

/** Page sizes the `<DataTablePagination />` control offers. */
export const PAGE_SIZE_OPTIONS: ReadonlyArray<number> = [25, 50, 100];

/**
 * Settlement items page size.
 *
 * Was 500 until PAY-1996. The batch detail page renders a virtualised table so the smaller
 * page is invisible to the user and survivable for the ledger.
 */
export const SETTLEMENT_ITEM_PAGE_SIZE = 50;

/** TCP connect budget. Beyond this the upstream is down, not slow. */
export const CONNECT_TIMEOUT_MS = 3_000;

export const LONG_READ_TIMEOUT_MS = 30_000;

/** Paths that get `LONG_READ_TIMEOUT_MS` instead of `READ_TIMEOUT_MS`. Prefix match. */
export const LONG_READ_PATH_PREFIXES: ReadonlyArray<string> = [
  '/settlements/',
  '/reporting/volume',
  '/reporting/balance-history',
];

/** Transport retry ceiling for idempotent verbs. */
export const MAX_TRANSPORT_RETRIES = 2;

/**
 * Alias of `MAX_TRANSPORT_RETRIES`.
 *
 * `api/client.ts` was written against this name and half the repo against the other one.
 * TODO(rrefactor): pick one and delete the other — PAY-1934.
 */
export const TRANSPORT_RETRIES = MAX_TRANSPORT_RETRIES;

/** First backoff step for a transport-level retry. Doubled per attempt, jittered. */
export const TRANSPORT_RETRY_BASE_MS = 250;

/** WebSocket reconnect backoff schedule, milliseconds. Jittered by `NotificationSocket`. */
export const WS_BACKOFF_MS: ReadonlyArray<number> = [500, 1_000, 2_000, 5_000, 10_000, 30_000];

/** Heartbeat ping interval. payzeno-api's gateway drops idle sockets at 60s. */
export const WS_HEARTBEAT_MS = 25_000;

/** How long a toast stays up before it auto-dismisses. Errors stay until dismissed. */
export const TOAST_DURATION_MS = 5_000;

/** Debounce for search-as-you-type filters. */
export const FILTER_DEBOUNCE_MS = 250;

/** TanStack Query defaults. Lists go stale fast; a settlement batch does not. */
export const STALE_TIME_MS = 30_000;
/** Rows rendered while a list query is pending. */
export const SKELETON_ROW_COUNT = 8;

/** Above this row count `<DataTable />` switches to windowed rendering. */
export const VIRTUALISATION_THRESHOLD = 200;

/** The plaintext API key secret is shown once, for this long, then never again. */
export const SECRET_REVEAL_MS = 60_000;

