/**
 * LEGACY. A second hand-rolled fetch helper. Yes, two.
 *
 * `fetch-json.ts` came first; this one was added when the team tab needed a POST with an
 * idempotency key and nobody wanted to touch the invoices path. Live callers:
 * `features/settings/useUsers.ts` and `features/settings/useInviteUser.ts`.
 *
 * Its errors are bare `Error`s (see `legacy-errors.ts`), so a 403 on the team tab renders the
 * generic fallback instead of `<PermissionDenied/>`. That is a real, visible bug and it is
 * why PAY-1744 exists.
 */
import { ulid } from 'ulid';

import { runtime } from '@config/runtime';

import { throwLegacyError } from './legacy-errors';

type Verb = 'GET' | 'POST' | 'DELETE';

interface ApiFetchInit {
  verb?: Verb;
  payload?: unknown;
  params?: Record<string, string | number | undefined>;
}

/** Third implementation of query serialisation in this repo. Nobody is proud of it. */
function qs(params?: ApiFetchInit['params']): string {
  if (!params) return '';
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return pairs.length ? `?${pairs.join('&')}` : '';
}

function readCsrf(): string | undefined {
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (name === 'pz_csrf') return rest.join('=');
  }
  return undefined;
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  const token = readCsrf();
  if (token && verb !== 'GET') headers['X-Payzeno-CSRF'] = token;
  if (verb !== 'GET') headers['Idempotency-Key'] = ulid();
  if (init.payload !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${runtime.apiBaseUrl}${path}${qs(init.params)}`, {
    method: verb,
    headers,
    credentials: 'include',
    body: init.payload === undefined ? undefined : JSON.stringify(init.payload),
  });

  if (response.status === 204) return undefined as T;

}
