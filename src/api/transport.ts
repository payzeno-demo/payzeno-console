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
