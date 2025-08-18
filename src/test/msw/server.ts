/**
 * The MSW node server. One instance for the whole run; `src/test/setup.ts` owns its
 * lifecycle (`listen` in `beforeAll`, `resetHandlers` in `afterEach`, `close` in `afterAll`).
 *
 * Importing this module from a test file is how a case installs a one-off override:
 *
 * ```ts
 * server.use(errorHandler('get', '/payouts', 502, 'processor_unavailable'));
 * ```
 *
 * `resetHandlers()` in `afterEach` puts the default set back, so an override cannot leak into
 * the next case — which it did, for a fortnight, before that line existed (PAY-1861).
 */
import { setupServer } from 'msw/node';

import { handlers } from './handlers';

export const server = setupServer(...handlers);

/** Re-exported so a test needs one import for the server and its override helpers. */
export { errorHandler, url, API_BASE, HANDLED_PATHS } from './handlers';

/**
 * Records the requests MSW sees, so a test can assert *what the transport actually sent*
 * rather than only what came back. `ApiClient` is the only thing in the repo that sets
 * `X-Payzeno-CSRF` and `Idempotency-Key`, and this is how `client.test.ts` proves it.
 *
 * Returns a disposer; call it in the test's cleanup or the listener outlives the case.
 */
export interface RecordedRequest {
  method: string;
  url: string;
  headers: Headers;
}

export function recordRequests(): {
  requests: RecordedRequest[];
  stop: () => void;
} {
  const requests: RecordedRequest[] = [];

  const listener = ({ request }: { request: Request }): void => {
    requests.push({ method: request.method, url: request.url, headers: request.headers });
  };

  server.events.on('request:start', listener);

  return {
    requests,
    stop: () => server.events.removeListener('request:start', listener),
  };
}
