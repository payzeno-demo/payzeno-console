/**
 * CSRF double-submit — api-surface.md §1.3.
 *
 * `pz_csrf` is set by `POST /v1/auth/login` and refreshed by `GET /v1/auth/me`. It is
 * deliberately **not** HttpOnly: the browser must be able to read it back and echo it in
 * `X-Payzeno-CSRF` on every mutating session request. `pz_session` is HttpOnly and is never
 * touched here.
 *
 * Only `ApiClient.request` calls `withCsrf`. `src/api/legacy/api-fetch.ts` builds the header
 * itself, slightly differently — that divergence is the point of ADR 0004 (see §8.1 of the
 * console blueprint), not an accident.
 */
import { HEADER_CSRF } from './headers';

export const CSRF_COOKIE_NAME = 'pz_csrf';

export class MissingCsrfTokenError extends Error {
  constructor() {
    super(
      'No pz_csrf cookie. The session expired or the cookie was set on another origin — ' +
        'sign in again.',
    );
    this.name = 'MissingCsrfTokenError';
  }
}

/**
 * Reads the non-HttpOnly `pz_csrf` cookie. Returns null when absent, which happens on a cold
 * boot before `GET /v1/auth/me` has run.
 */
export function readCsrfCookie(documentRef: Document = document): string | null {
  const raw = documentRef.cookie;
  if (!raw) return null;

  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    if (trimmed.slice(0, separator) !== CSRF_COOKIE_NAME) continue;
    const value = decodeURIComponent(trimmed.slice(separator + 1));
    return value.length > 0 ? value : null;
  }

  return null;
}

/**
 * Adds `X-Payzeno-CSRF` to a mutating request's headers. GET requests are exempt (no
 * ambient-credential risk), and so are api-key/internal calls — but the console only ever
 * holds a session, so every non-GET goes through here.
 */
export function withCsrf(
  headers: Record<string, string>,
  method: string,
): Record<string, string> {
  if (method === 'GET') return headers;

  const token = readCsrfCookie();
  if (!token) {
    // Deliberately not thrown: a mutating call with no cookie gets a 403 from SessionGuard,
    // which the error mapper turns into ForbiddenError and AuthProvider turns into a
    // redirect. Throwing here would lose the request id and produce a worse error message.
    return headers;
  }

  return { ...headers, [HEADER_CSRF]: token };
}

/** Used by `AuthProvider` to decide whether a bootstrap call is even worth making. */
export function hasCsrfToken(): boolean {
  return readCsrfCookie() !== null;
}
