/**
 * Where the admin app sends its requests.
 *
 * The bundle is built once with `VITE_PAYZENO_API_URL=http://localhost/v1` (the console's
 * host). The admin entry is served from a different host — `admin.localhost` locally,
 * `admin.payzeno.com` in production — and payzeno-nginx proxies `/v1` on that host too
 * (`payzeno-infrastructure/nginx/payzeno-admin.conf`). Calling the console's host from the
 * admin host would make `pz_staff_session` and `pz_csrf` third-party cookies: the CSRF
 * double-submit cannot read a cookie set on another host, so every mutation would 403.
 *
 * So the admin app keeps the configured *path* (`/v1`) and swaps in its own origin. That is
 * not a ninth config surface: it is the same `Env.apiUrl`, resolved against the page.
 */
import { runtimeConfig } from '@config/runtime';

export function adminApiBaseUrl(
  origin: string = window.location.origin,
  configured: string = runtimeConfig.apiBaseUrl,
): string {
  let path = '/v1';
  try {
    path = new URL(configured).pathname;
  } catch {
    // `env.ts` already rejects a non-URL, so this is belt and braces for a hand-built config.
  }
  const trimmed = path.endsWith('/') ? path.slice(0, -1) : path;
  return `${origin}${trimmed}`;
}
