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
