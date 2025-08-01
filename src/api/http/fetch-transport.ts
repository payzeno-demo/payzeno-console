/**
 * The raw `fetch` seam. `.eslintrc.cjs` bans `fetch(` repo-wide with `no-restricted-syntax`
 * and turns it off for this file and `api/legacy/**` only. Two further call sites carry an
 * inline disable, and both post to the **vault's** origin rather than ours (ADR 0003):
 * `components/form/TokenizedCardInput.tsx` and
 * `features/settings/components/AddBankAccountDialog.tsx`. Everything that talks to
 * payzeno-api comes through here.
 *
 * `credentials: 'include'` is mandatory: the session lives in the HttpOnly `pz_session`
 * cookie and the console is served from a different port than payzeno-api in dev.
 */
import type { BuiltRequest } from './request-builder';
import { RequestTimeoutError, withTimeout } from './timeout';

export interface RawResponse {
  status: number;
  headers: Headers;
  /** Undefined for 204/205. */
  text: string | undefined;
  url: string;
}

export class NetworkError extends Error {
  constructor(
    readonly url: string,
    readonly cause: unknown,
  ) {
    super(`Network request to ${url} failed`);
    this.name = 'NetworkError';
  }
}

export interface FetchTransportOptions {
  timeoutMs: number;
  /** TanStack Query passes its own signal so a navigated-away query cancels in flight. */
  parentSignal?: AbortSignal;
}

/**
 * Issues one HTTP request and returns the raw envelope. It does not parse, it does not map
 * errors and it does not retry — those are `response-parser.ts`, `error-mapper.ts` and
 * `retry.ts` respectively. Keeping them apart is what lets `retry` re-run exactly this.
 */
export async function fetchTransport(
  request: BuiltRequest,
  options: FetchTransportOptions,
): Promise<RawResponse> {
  const handle = withTimeout(options.timeoutMs, options.parentSignal);

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      credentials: 'include',
      redirect: 'follow',
      signal: handle.signal,
    });

    const hasNoBody = response.status === 204 || response.status === 205;
    const text = hasNoBody ? undefined : await response.text();

    return {
      status: response.status,
      headers: response.headers,
      text,
      url: response.url || request.url,
    };
  } catch (err) {
    if (handle.timedOut()) {
      throw new RequestTimeoutError(options.timeoutMs, request.url);
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      // The caller cancelled (route change, component unmount). Propagate untouched so
      // TanStack Query recognises it as a cancellation rather than a failure.
      throw err;
    }
    throw new NetworkError(request.url, err);
  } finally {
    handle.dispose();
  }
}
