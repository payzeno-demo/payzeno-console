/**
 * The frozen error hierarchy (interfaces.md §4.3).
 *
 * The chain crosses a repo boundary — `ConsoleApiError extends PayzenoError`, which lives in
 * `@payzeno/contracts/errors` — so the first block below is not ceremony. If the shared package
 * ever stops exporting a class, this is where it breaks, rather than in a component nobody
 * associates with a version bump.
 */
import { PayzenoError } from '@payzeno/contracts/errors';
import { describe, expect, it } from 'vitest';

import {
  BadRequestApiError,
  ConflictApiError,
  ConsoleApiError,
  ForbiddenError,
  NotFoundApiError,
  RateLimitedApiError,
  ServerError,
  UnauthorizedError,
  UpstreamUnavailableApiError,
  ValidationApiError,
  isApiErrorBody,
  isClientError,
  isConsoleApiError,
} from '@api/errors';
import type { ConsoleApiErrorInit } from '@api/errors';

function init(overrides: Partial<ConsoleApiErrorInit> = {}): ConsoleApiErrorInit {
  return {
    status: 500,
    code: 'internal_error',
    message: 'Something went wrong.',
    requestId: 'req_test_0001',
    ...overrides,
  };
}

const SUBCLASSES = [
  BadRequestApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundApiError,
  ConflictApiError,
  ValidationApiError,
  RateLimitedApiError,
  UpstreamUnavailableApiError,
  ServerError,
] as const;

describe('the inheritance chain', () => {
  it('roots every subclass in PayzenoError, from @payzeno/contracts', () => {
    for (const Subclass of SUBCLASSES) {
      const error = new Subclass(init());
      expect(error).toBeInstanceOf(Subclass);
      expect(error).toBeInstanceOf(ConsoleApiError);
      expect(error).toBeInstanceOf(PayzenoError);
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('names each instance after its own constructor, so a stack reads honestly', () => {
    expect(new NotFoundApiError(init({ status: 404 })).name).toBe('NotFoundApiError');
    expect(new ConflictApiError(init({ status: 409 })).name).toBe('ConflictApiError');
  });

  it('declares all nine subclasses — the count is the contract', () => {
    expect(SUBCLASSES).toHaveLength(9);
  });
});

describe('ConsoleApiError', () => {
  it('carries status under both `status` and `httpStatus`', () => {
    const error = new ConsoleApiError(init({ status: 404 }));
    expect(error.status).toBe(404);
    expect(error.httpStatus).toBe(404);
  });

  it('defaults fieldErrors to an empty array so a form can map unconditionally', () => {
    expect(new ConsoleApiError(init()).fieldErrors).toEqual([]);
    expect(new ConsoleApiError(init()).fieldErrorMap()).toEqual({});
  });

  it('indexes field errors by their dotted path', () => {
    const error = new ValidationApiError(
      init({
        status: 422,
        code: 'validation_failed',
        fieldErrors: [
          { path: 'amount_minor', code: 'out_of_range', message: 'Too large.' },
          { path: 'evidence.customer_email', code: 'invalid_format', message: 'Not an email.' },
        ],
      }),
    );

    expect(error.fieldErrorMap()).toEqual({
      amount_minor: 'Too large.',
      'evidence.customer_email': 'Not an email.',
    });
  });

  it('treats 429 and 5xx-from-503-up as transient, and 4xx as not', () => {
    expect(new RateLimitedApiError(init({ status: 429 })).isTransient()).toBe(true);
    expect(new UpstreamUnavailableApiError(init({ status: 502 })).isTransient()).toBe(true);
    expect(new UpstreamUnavailableApiError(init({ status: 504 })).isTransient()).toBe(true);
    expect(new NotFoundApiError(init({ status: 404 })).isTransient()).toBe(false);
    expect(new ForbiddenError(init({ status: 403 })).isTransient()).toBe(false);
  });

  it('keeps the request id, because it is the only thing support can search on', () => {
    expect(new ServerError(init({ requestId: 'req_abc' })).requestId).toBe('req_abc');
  });
});

describe('ConflictApiError — the arc-INC discriminator', () => {
  it('recognises settlement_locked, the code the retry hook treats as a no-op', () => {
    const locked = new ConflictApiError(init({ status: 409, code: 'settlement_locked' }));
    expect(locked.isSettlementLocked()).toBe(true);
    expect(locked.isIdempotencyInProgress()).toBe(false);
  });

  it('recognises idempotency_in_progress separately — that one is worth retrying', () => {
    const inProgress = new ConflictApiError(
      init({ status: 409, code: 'idempotency_in_progress' }),
    );
    expect(inProgress.isIdempotencyInProgress()).toBe(true);
    expect(inProgress.isSettlementLocked()).toBe(false);
  });

  it('does not confuse a generic conflict for either', () => {
    const generic = new ConflictApiError(init({ status: 409, code: 'conflict' }));
    expect(generic.isSettlementLocked()).toBe(false);
    expect(generic.isIdempotencyInProgress()).toBe(false);
  });
});

describe('RateLimitedApiError.retryAfter', () => {
  it('uses the parsed Retry-After when the header was present', () => {
    const error = new RateLimitedApiError(init({ status: 429, retryAfterSeconds: 12 }));
    expect(error.retryAfter).toBe(12);
  });

  it('falls back to 30 seconds rather than to NaN', () => {
    expect(new RateLimitedApiError(init({ status: 429 })).retryAfter).toBe(30);
  });
});

describe('narrowing helpers', () => {
  it('isConsoleApiError accepts the whole tree and rejects a bare Error', () => {
    expect(isConsoleApiError(new ForbiddenError(init({ status: 403 })))).toBe(true);
    expect(isConsoleApiError(new Error('plain'))).toBe(false);
    expect(isConsoleApiError(null)).toBe(false);
    expect(isConsoleApiError('403')).toBe(false);
  });

  it('isClientError is true only for 4xx — this is the retry gate', () => {
    expect(isClientError(new NotFoundApiError(init({ status: 404 })))).toBe(true);
    expect(isClientError(new RateLimitedApiError(init({ status: 429 })))).toBe(true);
    expect(isClientError(new UpstreamUnavailableApiError(init({ status: 502 })))).toBe(false);
    expect(isClientError(new Error('plain'))).toBe(false);
  });

  it('isApiErrorBody recognises the wire envelope and nothing else', () => {
    expect(isApiErrorBody({ error: { code: 'not_found', message: 'no' } })).toBe(true);
    expect(isApiErrorBody({ error: { message: 'no code' } })).toBe(false);
    expect(isApiErrorBody({ code: 'not_found' })).toBe(false);
    expect(isApiErrorBody('not json')).toBe(false);
    expect(isApiErrorBody(null)).toBe(false);
  });
});
