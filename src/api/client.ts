/**
 * `ApiClient` — the console's one HTTP client against payzeno-api.
 *
 * It implements `HttpTransport` (interfaces.md §4.2) so that `TransportProvider` can hand
 * `MockTransport` to exactly the same endpoint registry under `?mock=1`.
 *
 * `request()` is the single funnel. In order it:
 *   1. builds the URL, query string and headers          (`http/request-builder.ts`)
 *   2. attaches `X-Payzeno-CSRF` from the `pz_csrf` cookie (`http/csrf.ts` — only here)
 *   3. resolves the per-route read timeout                (`http/timeout.ts`)
 *   4. issues the request                                 (`http/fetch-transport.ts`)
 *   5. parses the envelope                                (`http/response-parser.ts`)
 *   6. maps any non-2xx onto the `ConsoleApiError` tree   (`http/error-mapper.ts`)
 *   7. retries the *attempt* under `http/retry.ts`, reusing the idempotency key
 *
 * Nothing else in the repo may do any of steps 2, 4 or 6.
 */
import { CONNECT_TIMEOUT_MS, TRANSPORT_RETRY_BASE_MS, TRANSPORT_RETRIES } from '@config/constants';
import { runtime } from '@config/runtime';

import { toConsoleApiError, transportFailureToApiError } from './http/error-mapper';
import { fetchTransport, NetworkError } from './http/fetch-transport';
import { IdempotencyAttempt } from './http/idempotency';
import { buildRequest } from './http/request-builder';
import { parseResponse } from './http/response-parser';
import { decideRetry, sleep } from './http/retry';
import { RequestTimeoutError, timeoutForPath } from './http/timeout';
import type { ApiClientOptions, HttpTransport, QueryParams, RequestSpec } from './transport';

export const DEFAULT_CLIENT_OPTIONS: ApiClientOptions = {
  baseUrl: runtime.apiBaseUrl,
  connectTimeoutMs: CONNECT_TIMEOUT_MS,
  readTimeoutMs: 10_000,
  retries: TRANSPORT_RETRIES,
  retryOn: [502, 503, 504],
  apiVersion: runtime.apiVersion,
  userAgent: `payzeno-console/${runtime.environment}`,
};

export class ApiClient implements HttpTransport {
  private readonly options: ApiClientOptions;

  constructor(options: Partial<ApiClientOptions> = {}) {
    this.options = { ...DEFAULT_CLIENT_OPTIONS, ...options };
  }

  /**
   * The one funnel. Every other method on this class delegates here, and every endpoint class
   * reaches the network through exactly this frame.
   */
  async request<TRes, TBody = unknown>(spec: RequestSpec<TBody>): Promise<TRes> {
    const built = buildRequest(spec);
    const timeoutMs = timeoutForPath(spec.path, spec.timeoutMs);

    let attempt = 0;
    // Loop bounded by `decideRetry`, which stops at `options.retries + 1` attempts.
    for (;;) {
      attempt += 1;
      try {
        const raw = await fetchTransport(built, { timeoutMs });
        const parsed = parseResponse<TRes>(raw);

        if (parsed.ok) {
          return parsed.data;
        }

        throw toConsoleApiError(parsed, raw.headers);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err;

        const decision = decideRetry(err, attempt, {
          maxAttempts: this.options.retries + 1,
          baseDelayMs: TRANSPORT_RETRY_BASE_MS,
          method: spec.method,
          hasIdempotencyKey: spec.idempotencyKey !== undefined,
          noRetry: spec.noRetry,
        });

        if (!decision.retry) {
          if (err instanceof RequestTimeoutError || err instanceof NetworkError) {
            throw transportFailureToApiError(built.url, 'client');
          }
          throw err;
        }

        await sleep(decision.delayMs);
      }
    }
  }

  get<TRes>(path: string, query?: QueryParams): Promise<TRes> {
    return this.request<TRes>({ method: 'GET', path, query });
  }

  /**
   * `idempotencyKey` is required, not optional: api-surface.md §1.3 requires the header on
   * every public POST, and an optional parameter means five of the six mutation hooks forget
   * it. Callers that do not have a key mint one with `newIdempotencyKey()`.
   */
  post<TRes, TBody>(path: string, body: TBody, idempotencyKey: string): Promise<TRes> {
    return this.request<TRes, TBody>({ method: 'POST', path, body, idempotencyKey });
  }

  patch<TRes, TBody>(path: string, body: TBody, idempotencyKey: string): Promise<TRes> {
    return this.request<TRes, TBody>({ method: 'PATCH', path, body, idempotencyKey });
  }

  async delete(path: string, idempotencyKey: string): Promise<void> {
    await this.request<void>({ method: 'DELETE', path, idempotencyKey });
  }

  /**
   * Convenience for a mutation that wants one key for the whole attempt (including transport
   * retries). Used by `useCreateRefund`, `useCreatePayout` and `useRetrySettlementItem`.
   */
  newAttempt(): IdempotencyAttempt {
    return new IdempotencyAttempt();
  }
}
