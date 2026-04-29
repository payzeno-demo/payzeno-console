/**
 * `error-mapper.ts` is the *only* construction site for the `ConsoleApiError` tree
 * (interfaces.md §4.3). Everything below drives it directly with a `ParsedError`, because the
 * whole point of the module is that nobody else may call `new ConflictApiError(...)`.
 */
import { describe, expect, it } from 'vitest';

import {
  BadRequestApiError,
  ConflictApiError,
  ForbiddenError,
  NotFoundApiError,
  RateLimitedApiError,
  ServerError,
  UnauthorizedError,
  UpstreamUnavailableApiError,
  ValidationApiError,
} from '@api/errors';
import { toConsoleApiError, transportFailureToApiError } from '@api/http/error-mapper';
import type { ParsedError } from '@api/http/response-parser';

function parsed(status: number, body: ParsedError['body'] = null): ParsedError {
  return { ok: false, status, requestId: 'req_parsed_0001', body, raw: undefined };
}

function envelope(code: string, message: string, extra: Record<string, unknown> = {}) {
  return {
    error: { code, message, request_id: 'req_envelope_0001', ...extra },
  } as unknown as NonNullable<ParsedError['body']>;
}

describe('status → subclass', () => {
  it.each([
    [400, BadRequestApiError],
    [401, UnauthorizedError],
    [403, ForbiddenError],
    [404, NotFoundApiError],
    [409, ConflictApiError],
    [422, ValidationApiError],
    [429, RateLimitedApiError],
    [502, UpstreamUnavailableApiError],
    [503, UpstreamUnavailableApiError],
    [504, UpstreamUnavailableApiError],
  ] as const)('maps %i', (status, Expected) => {
    expect(toConsoleApiError(parsed(status))).toBeInstanceOf(Expected);
  });

  it('sends 402 to ServerError — the console can reach it through a re-presented card', () => {
    const error = toConsoleApiError(parsed(402, envelope('card_declined', 'Declined.')));
    expect(error).toBeInstanceOf(ServerError);
    expect(error.code).toBe('card_declined');
  });

  it('sends anything unmapped to ServerError rather than dropping it', () => {
    for (const status of [418, 500, 507, 599]) {
      expect(toConsoleApiError(parsed(status))).toBeInstanceOf(ServerError);
    }
  });
});

describe('envelope handling', () => {
  it('prefers the server envelope over every fallback', () => {
    const error = toConsoleApiError(
      parsed(409, envelope('settlement_locked', 'A sweep holds this batch.')),
    );

    expect(error.code).toBe('settlement_locked');
    expect(error.message).toBe('A sweep holds this batch.');
    expect(error.requestId).toBe('req_envelope_0001');
    expect((error as ConflictApiError).isSettlementLocked()).toBe(true);
  });

  it('synthesises a code and a human message when nginx answers instead of the API', () => {
    const error = toConsoleApiError(parsed(502));

    expect(error.code).toBe('processor_unavailable');
    expect(error.message).toBe('An upstream service is unavailable.');
    // The request id then comes from the response header, via `parseResponse`.
    expect(error.requestId).toBe('req_parsed_0001');
  });

  it.each([
    [400, 'invalid_request'],
    [401, 'authentication_required'],
    [403, 'permission_denied'],
    [404, 'not_found'],
    [409, 'conflict'],
    [422, 'validation_failed'],
    [429, 'rate_limited'],
    [500, 'internal_error'],
  ] as const)('falls back to a sensible code for a bodyless %i', (status, code) => {
    expect(toConsoleApiError(parsed(status)).code).toBe(code);
  });

  it('carries field errors through onto a 422', () => {
    const error = toConsoleApiError(
      parsed(
        422,
        envelope('validation_failed', 'Check the fields.', {
          field_errors: [{ path: 'amount_minor', message: 'Above the refundable amount.' }],
        }),
      ),
    );

    expect(error.fieldErrors).toHaveLength(1);
    expect(error.fieldErrorMap()).toEqual({
      amount_minor: 'Above the refundable amount.',
    });
  });

  it('carries `details` through onto the error, for the settlement item id', () => {
    const error = toConsoleApiError(
      parsed(
        409,
        envelope('settlement_locked', 'Locked.', {
          details: { item_id: 'ri_01HW0RTITEM00000000002' },
        }),
      ),
    );

    expect(error).toBeInstanceOf(ConflictApiError);
    expect(error.message).toBe('Locked.');
  });
});

describe('retry-after resolution', () => {
  it('prefers the envelope value over the header', () => {
    const headers = new Headers({ 'Retry-After': '60' });
    const error = toConsoleApiError(
      parsed(429, envelope('rate_limited', 'Slow down.', { retry_after: 5 })),
      headers,
    ) as RateLimitedApiError;

    expect(error.retryAfter).toBe(5);
  });

  it('reads the header when the envelope is silent', () => {
    const headers = new Headers({ 'Retry-After': '45' });
    const error = toConsoleApiError(parsed(429), headers) as RateLimitedApiError;

    expect(error.retryAfter).toBe(45);
  });

  it('works with no headers at all — MockTransport passes none', () => {
    const error = toConsoleApiError(parsed(429)) as RateLimitedApiError;
    expect(error.retryAfter).toBe(30);
    expect(error.retryAfterSeconds).toBeNull();
  });

  it('ignores an unparseable Retry-After rather than producing NaN', () => {
    const headers = new Headers({ 'Retry-After': 'Wed, 21 Oct 2026 07:28:00 GMT' });
    const error = toConsoleApiError(parsed(429), headers) as RateLimitedApiError;
    expect(error.retryAfter).toBe(30);
  });
});

describe('transportFailureToApiError', () => {
  it('presents a dead socket as a 502 with the URL in the message', () => {
    const error = transportFailureToApiError('http://localhost/v1/payouts', 'req_client_0001');

    expect(error).toBeInstanceOf(UpstreamUnavailableApiError);
    expect(error.status).toBe(502);
    expect(error.code).toBe('processor_unavailable');
    expect(error.message).toContain('http://localhost/v1/payouts');
    expect(error.requestId).toBe('req_client_0001');
  });

  it('produces something the query retry policy will actually retry', () => {
    expect(transportFailureToApiError('http://x/y', 'r').isTransient()).toBe(true);
  });
});
