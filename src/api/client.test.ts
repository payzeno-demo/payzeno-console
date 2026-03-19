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
    const page = await client.get<{ data: unknown[]; has_more: boolean }>('/charges');

    expect(page.data).toHaveLength(3);
    expect(page.has_more).toBe(false);
  });

  it('serialises query parameters and drops undefined ones', async () => {
    const client = new ApiClient();

    await client.get('/charges', { limit: 25, status: 'captured', cursor: undefined });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('limit=25');
    expect(request?.url).toContain('status=captured');
    expect(request?.url).not.toContain('cursor');
  });

  it('sends Accept, the pinned API version and a fresh request id on every call', async () => {
    const recorder = recordRequests();
    const recorder = recordRequests();

    await new ApiClient().get('/charges');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.method).toBe('POST');
    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toBe('idem-key-0001');
    expect(request?.headers.get('Content-Type')).toBe('application/json');
  });

  it('attaches X-Payzeno-CSRF from the pz_csrf cookie on a mutating verb', async () => {
    setCsrfCookie('csrf-token-write');
    const recorder = recordRequests();

    await new ApiClient().post('/refunds', { charge_id: 'ch_1' }, 'idem-key-0002');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.headers.get(HEADER_CSRF)).toBe('csrf-token-write');
  });

  it('sends the mutation without a CSRF header rather than throwing when the cookie is gone', async () => {
    const recorder = recordRequests();

    await expect(
      new ApiClient().post('/refunds', { charge_id: 'ch_1' }, 'idem-key-0003'),
    ).resolves.toBeDefined();

    const request = recorder.requests.at(-1);
    recorder.stop();

    // SessionGuard turns this into a 403, which carries a request id. Throwing client-side
    // would lose it — see the comment in `http/csrf.ts`.
    expect(request?.headers.get(HEADER_CSRF)).toBeNull();
  });

  it('returns undefined for a 204 rather than choking on an empty body', async () => {
    server.use(
      http.delete(url('/api-keys/:apiKeyId'), () => new HttpResponse(null, { status: 204 })),
    );

    await expect(new ApiClient().delete('/api-keys/key_1', 'idem-key-0004')).resolves.toBeUndefined();
  });
});

describe('ApiClient error mapping', () => {
  it.each([
    [401, 'authentication_required', UnauthorizedError],
    [403, 'permission_denied', ForbiddenError],
    [404, 'not_found', NotFoundApiError],
    [409, 'settlement_locked', ConflictApiError],
    [422, 'validation_failed', ValidationApiError],
    [429, 'rate_limited', RateLimitedApiError],
    [502, 'processor_unavailable', UpstreamUnavailableApiError],
    [500, 'internal_error', ServerError],
  ] as const)('maps %i onto its subclass', async (status, code, Expected) => {
    server.use(errorHandler('get', '/charges', status, code, 'synthetic'));

    // 502 is retried by the transport; a zero-retry client keeps the assertion quick.
    const client = new ApiClient({ retries: 0 });
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

    const thrown = (await new ApiClient({ retries: 0 })
      .get('/charges')
      .catch((err: unknown) => err)) as RateLimitedApiError;

    expect(thrown.retryAfter).toBe(17);
  });
});

describe('ApiClient transport retry', () => {
  it('repeats an idempotent GET through a 503 and returns the eventual body', async () => {
    const page = await new ApiClient().get<{ data: unknown[] }>('/charges');

    expect(calls).toBe(2);
    expect(page.data).toHaveLength(1);
  });

  it('gives up after `retries` attempts and surfaces the upstream error', async () => {
    const thrown = await new ApiClient({ retries: 1 })
      .get('/charges')
      .catch((err: unknown) => err);

    expect(calls).toBe(2);
    expect(thrown).toBeInstanceOf(UpstreamUnavailableApiError);
  });

  it('never repeats a 4xx — a 409 is an answer, not a hiccup', async () => {
    let calls = 0;
    server.use(
      http.get(url('/charges'), () => {
        calls += 1;
        return HttpResponse.json(
          { error: { code: 'conflict', message: 'nope', request_id: 'r' } },
          { status: 409 },
        );
      }),
    );

    await new ApiClient().get('/charges').catch(() => undefined);

    expect(calls).toBe(1);
  });

  it('reuses one idempotency key across the retries of a single attempt', async () => {
    const client = new ApiClient();
    const first = client.newAttempt();
  });
});
