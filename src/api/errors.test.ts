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

  it('carries status under both `status` and `httpStatus`', () => {
    const error = new ConsoleApiError(init({ status: 404 }));
    expect(error.status).toBe(404);
    expect(error.httpStatus).toBe(404);
  });

  it('indexes field errors by their dotted path', () => {
    const error = new ValidationApiError(
      init({
        status: 422,
        code: 'validation_failed',
        fieldErrors: [
          { path: 'amount_minor', message: 'Too large.' },
          { path: 'evidence.customer_email', message: 'Not an email.' },
        ],
      }),
    );

    expect(error.fieldErrorMap()).toEqual({
      amount_minor: 'Too large.',
      'evidence.customer_email': 'Not an email.',
    });
  });

  it('recognises idempotency_in_progress separately — that one is worth retrying', () => {
    const inProgress = new ConflictApiError(
      init({ status: 409, code: 'idempotency_in_progress' }),
    );
    expect(inProgress.isIdempotencyInProgress()).toBe(true);
    expect(inProgress.isSettlementLocked()).toBe(false);
  });

  it('falls back to 30 seconds rather than to NaN', () => {
    expect(new RateLimitedApiError(init({ status: 429 })).retryAfter).toBe(30);
  });
});

describe('narrowing helpers', () => {
  it('isClientError is true only for 4xx — this is the retry gate', () => {
    expect(isClientError(new NotFoundApiError(init({ status: 404 })))).toBe(true);
    expect(isClientError(new RateLimitedApiError(init({ status: 429 })))).toBe(true);
    expect(isClientError(new UpstreamUnavailableApiError(init({ status: 502 })))).toBe(false);
    expect(isClientError(new Error('plain'))).toBe(false);
  });

});
