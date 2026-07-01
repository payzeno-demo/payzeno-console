/**
 * LEGACY. The original hand-rolled fetch helper, from before `ResourceEndpoint` existed.
 *
 * Still used by `features/invoices/invoices.queries.ts`. It builds its own CSRF header, does
 * not send `Payzeno-Version`, does not honour `X-Request-Id`, and its failures never become
 * a `ConsoleApiError`.
 *
 * FIXME(rrefactor): migrate invoices to `InvoicesEndpoint` — docs/adr/0004-endpoint-classes-over-fetch-helpers.md.
 * Blocked on nothing. Deprioritised four quarters running. PAY-1902.
 */
import { runtime } from '@config/runtime';

import { throwLegacyError } from './legacy-errors';

export interface FetchJsonOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: FetchJsonOptions['query']): string {
  const base = runtime.apiBaseUrl.replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    search.append(key, String(value));
  }
  const serialised = search.toString();
  return serialised ? `${url}?${serialised}` : url;
}

/** Reads `pz_csrf` by hand. Slightly different from `api/http/csrf.ts` — it does not
 * `decodeURIComponent`, which has never mattered because the token is base64url. */
function csrfHeader(): Record<string, string> {
  const match = /(?:^|;\s*)pz_csrf=([^;]+)/.exec(document.cookie);
  return match?.[1] ? { 'X-Payzeno-CSRF': match[1] } : {};
}

export async function fetchJson<T>(path: string, options: FetchJsonOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json', ...csrfHeader() };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
