/**
 * The transport seam.
 *
 * `HttpTransport` carries the full verb surface deliberately: `ResourceEndpoint` depends on
 * this interface and nothing else, so `?mock=1` can substitute `MockTransport` for the entire
 * application without a single per-feature branch. An interface with only `request()` would
 * leave `MockTransport` unwireable.
 *
 * interfaces.md §4.2 freezes every signature below. Do not widen, narrow or reorder them.
 */
import type { ListQuery, Paginated } from '@payzeno/contracts';

export type QueryParams = Record<string, string | number | boolean | undefined>;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface RequestSpec<TBody = unknown> {
  method: HttpMethod;
  /** Path relative to the versioned base URL, e.g. `/settlements/sb_123/items`. */
  path: string;
  query?: QueryParams;
  body?: TBody;
  headers?: Record<string, string>;
  /** Overrides `READ_TIMEOUT_MS`. Settlement item lists pass `LONG_READ_TIMEOUT_MS`. */
  timeoutMs?: number;
  /** Required on POST/PATCH/DELETE. Minted once per mutation *attempt*. */
  idempotencyKey?: string;
  /** Opt out of transport-level retry for a call the caller knows is not safe to repeat. */
  noRetry?: boolean;
}

export interface HttpTransport {
  request<TRes, TBody = unknown>(spec: RequestSpec<TBody>): Promise<TRes>;
  get<TRes>(path: string, query?: QueryParams): Promise<TRes>;
  post<TRes, TBody>(path: string, body: TBody, idempotencyKey: string): Promise<TRes>;
  patch<TRes, TBody>(path: string, body: TBody, idempotencyKey: string): Promise<TRes>;
  delete(path: string, idempotencyKey: string): Promise<void>;
}

export interface ApiClientOptions {
  baseUrl: string;
  connectTimeoutMs: number;
  readTimeoutMs: number;
  retries: number;
  /** Status codes the transport may retry on an idempotent verb. */
  retryOn: ReadonlyArray<number>;
  apiVersion: string;
  userAgent: string;
}

/**
 * Every list route in api-surface.md returns `Paginated<T>` with an opaque cursor. This alias
 * exists so endpoint classes never have to spell the generic twice.
 */
export type ListResult<T> = Paginated<T>;

/**
 * Serialises a `ListQuery` (and any narrowed subtype) into flat query params. Undefined
 * values are dropped by `buildRequest`, so an absent filter never becomes `?status=undefined`.
 */
export function listQueryToParams(q?: ListQuery & Record<string, unknown>): QueryParams {
  if (!q) return {};
  const params: QueryParams = {};
  for (const [key, value] of Object.entries(q)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params[key] = value;
    } else {
