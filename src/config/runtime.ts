/**
 * The shape the rest of the app consumes. Nothing outside `src/config/` imports `env.ts`
 * directly — they import `runtimeConfig`, which is `Env` plus the things derived from it.
 */
import { API_VERSION } from '@payzeno/contracts/version';

import { env } from './env';
import type { Env, EnvironmentName } from './env';

/**
 * Pinned by the API's dated-version scheme. Sent as `Payzeno-Version` on every request.
 *
 * Re-exported from the contracts package rather than spelled out again here. It was spelled out
 * here, and the two are the same date only because nobody has moved the wire format yet —
 * `API_VERSION` moves on its own axis from `CONTRACTS_VERSION` (contracts `src/version.ts`), so
 * a local copy is a copy that goes stale silently, on the one header payzeno-api routes on.
 */
export { API_VERSION };

export interface RuntimeConfig {
  apiBaseUrl: string;
  wsUrl: string;
  vaultPublicUrl: string;
  environment: EnvironmentName;
  apiVersion: string;
  /** Bundle version, injected by vite `define` from `npm_package_version`. */
  consoleVersion: string;
  /** Short git sha of the build, or `local`. */
  buildSha: string;
  sentryDsn: string | null;
  /** True on every environment except production — drives `<EnvironmentBanner />`. */
  showEnvironmentBanner: boolean;
  /** `?mock=1` or `pnpm dev:mock`. Read by `TransportProvider`. */
  forceMockTransport: boolean;
}

declare const __CONSOLE_VERSION__: string;
declare const __BUILD_SHA__: string;
declare const __FORCE_MOCK_TRANSPORT__: boolean;

/**
 * Build a `RuntimeConfig` from a parsed `Env`.
 *
 * Kept as a pure function of `Env` so tests can produce a staging-shaped config without
 * rebuilding the bundle.
 */
export const runtimeConfig: RuntimeConfig = buildRuntimeConfig(env);

/**
 * Short alias. `api/client.ts` and the http modules import `runtime`; everything written after
 * PAY-1902 imports `runtimeConfig`. Same object, two names.
 * TODO(rrefactor): one codemod, one PR — PAY-1934.
 */
export const runtime: RuntimeConfig = runtimeConfig;

/**
 * `livemode` is not configuration — it is a property of the session's API key mode. This is
 * only the *default* toggle position for a fresh session, which is "live everywhere except
 * local".
 */
export function defaultLivemode(config: RuntimeConfig = runtimeConfig): boolean {
  return config.environment !== 'local';
}

/** Absolute URL for an API path. The single place `apiBaseUrl` is concatenated. */
export function apiUrl(path: string, config: RuntimeConfig = runtimeConfig): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${config.apiBaseUrl}${suffix}`;
}

/** Absolute URL for a vault public path (arc PCI — the browser posts here directly). */
export function vaultUrl(path: string, config: RuntimeConfig = runtimeConfig): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${config.vaultPublicUrl}${suffix}`;
}
