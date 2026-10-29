/**
 * Path + query serialisation and header assembly. One place, so the shape of every outgoing
 * request is inspectable in one diff.
 */
import { runtime } from '@config/runtime';

import type { QueryParams, RequestSpec } from '../transport';

import { withCsrf } from './csrf';
import { buildHeaders } from './headers';

export interface BuiltRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
  timeoutMs: number | undefined;
}

/**
 * Serialises query params. Undefined and empty-string values are dropped — an absent filter
 * must not become `?status=` and make payzeno-api's ValidationPipe reject the whole read.
 */
export function serialiseQuery(query?: QueryParams): string {
  if (!query) return '';

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.length === 0) continue;
    search.append(key, String(value));
  }

  const serialised = search.toString();
  return serialised.length > 0 ? `?${serialised}` : '';
}

/**
 * Joins the versioned base URL with a route path. `VITE_PAYZENO_API_URL` already carries the
 * `/v1` segment (`http://localhost/v1`), so endpoint `basePath` values are version-free.
 */
export function joinPath(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

/** Percent-encodes a path segment. Ids are opaque and could in principle carry a slash. */
export function pathSegment(value: string): string {
  return encodeURIComponent(value);
}

/**
 * @param baseUrl the versioned API base. Defaults to `VITE_PAYZENO_API_URL`; `ApiClient` passes
 * its own `options.baseUrl`, which is the build-time value unless a caller overrides it. The
 * admin entry (`src/admin/`) is the one caller that does: it is served from its own host and
 * must reach the API through that host's `/v1`, or the staff cookie and `pz_csrf` stop being
 * first-party.
 */
export function buildRequest<TBody>(
  spec: RequestSpec<TBody>,
  baseUrl: string = runtime.apiBaseUrl,
): BuiltRequest {
  const hasBody = spec.body !== undefined && spec.method !== 'GET';

  let headers = buildHeaders({
    hasBody,
    idempotencyKey: spec.idempotencyKey,
    extra: spec.headers,
  });
  headers = withCsrf(headers, spec.method);

  return {
    url: joinPath(baseUrl, spec.path) + serialiseQuery(spec.query),
    method: spec.method,
    headers,
    body: hasBody ? JSON.stringify(spec.body) : undefined,
    timeoutMs: spec.timeoutMs,
  };
}
