/**
 * `ApiClient` — the one funnel every endpoint reaches the network through.
 *
 * These cases drive the real class against MSW, so each one exercises the whole seam:
 * `request()` → `buildRequest()` → `withCsrf()` → `fetchTransport()` → `parseResponse()` →
 * `toConsoleApiError()`. Nothing here stubs `fetch`; `recordRequests()` reads what actually
 * went over the wire, which is the only honest way to assert on a header.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClient, DEFAULT_CLIENT_OPTIONS } from '@api/client';
import {
  ConflictApiError,
  ConsoleApiError,
  ForbiddenError,
  NotFoundApiError,
  RateLimitedApiError,
  ServerError,
  UnauthorizedError,
  UpstreamUnavailableApiError,
  ValidationApiError,
} from '@api/errors';
import { CSRF_COOKIE_NAME } from '@api/http/csrf';
import {
  HEADER_API_VERSION,
  HEADER_CSRF,
  HEADER_IDEMPOTENCY_KEY,
  HEADER_REQUEST_ID,
} from '@api/http/headers';
import { API_VERSION } from '@config/runtime';
import { HttpResponse, http } from 'msw';

import { makeCharge, makePage } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';

function setCsrfCookie(value: string | null): void {
  if (value === null) {
    document.cookie = `${CSRF_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    return;
  }
  document.cookie = `${CSRF_COOKIE_NAME}=${value}; path=/`;
}

afterEach(() => {
  setCsrfCookie(null);
});

describe('ApiClient defaults', () => {
  it('takes its base URL and version from the runtime config', () => {
    expect(DEFAULT_CLIENT_OPTIONS.baseUrl).toBe('http://localhost/v1');
    expect(DEFAULT_CLIENT_OPTIONS.apiVersion).toBe(API_VERSION);
    expect(DEFAULT_CLIENT_OPTIONS.retryOn).toEqual([502, 503, 504]);
  });

  it('lets a caller override options without losing the rest', () => {
    const client = new ApiClient({ retries: 0 });
    // The override is private, so we prove it through behaviour further down; here we only
    // assert the constructor accepts a partial without throwing.
    expect(client).toBeInstanceOf(ApiClient);
  });
});

describe('ApiClient.get', () => {
  it('builds the versioned URL and returns the parsed envelope', async () => {
    const recorder = recordRequests();
    const thrown = await client.get('/charges').catch((err: unknown) => err);

    expect(thrown).toBeInstanceOf(Expected);
    expect((thrown as ConsoleApiError).status).toBe(status);
    expect((thrown as ConsoleApiError).code).toBe(code);
    expect((thrown as ConsoleApiError).requestId).toBe('req_msw_error');
  });

  it('falls back to ServerError for a status nobody planned for', async () => {
    server.use(errorHandler('get', '/charges', 418, 'teapot'));

    const thrown = await new ApiClient({ retries: 0 })
      .get('/charges')
      .catch((err: unknown) => err);

    expect(thrown).toBeInstanceOf(ServerError);
    expect((thrown as ServerError).status).toBe(418);
  });

  it('reads field errors off a 422 so a form can map them', async () => {
    server.use(
      errorHandler('get', '/charges', 422, 'validation_failed', 'Some fields need attention.', {
        field_errors: [{ path: 'amount_minor', message: 'Above the refundable amount.' }],
      }),
    );

    const thrown = (await new ApiClient({ retries: 0 })
      .get('/charges')
      .catch((err: unknown) => err)) as ValidationApiError;

    expect(thrown.fieldErrorMap()).toEqual({
      amount_minor: 'Above the refundable amount.',
    });
  });

  it('reads Retry-After onto a 429 so RateLimitCountdown has a number', async () => {
    server.use(
      http.get(url('/charges'), () =>
        HttpResponse.json(
          { error: { code: 'rate_limited', message: 'Slow down.', request_id: 'req_rl' } },
          { status: 429, headers: { 'Retry-After': '17' } },
        ),
      ),
    );

  });
});
