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

export const runtimeConfig: RuntimeConfig = buildRuntimeConfig(env);

/**
 * Short alias. `api/client.ts` and the http modules import `runtime`; everything written after
 * PAY-1902 imports `runtimeConfig`. Same object, two names.
 * TODO(rrefactor): one codemod, one PR — PAY-1934.
 */
