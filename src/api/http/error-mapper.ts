/**
 * status -> ConsoleApiError subclass. THE ONLY construction site for the hierarchy in
 * `src/api/errors.ts` (interfaces.md §4.3). Anything unmapped becomes `ServerError`.
 *
 * The status list mirrors api-surface.md §1.4 exactly, including 402 (`card_declined` and
 * friends) which the console can reach via `POST /v1/refunds` against a re-presented card.
 */
import type { ErrorCode } from '@payzeno/contracts';

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
} from '../errors';

import { readRetryAfterSeconds } from './headers';
import type { ParsedError } from './response-parser';

const FALLBACK_MESSAGES: Readonly<Record<number, string>> = {
  400: 'The request was rejected.',
  401: 'Your session has expired. Sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find that.',
  409: 'That conflicts with the current state.',
  422: 'Some fields need attention.',
  429: 'Too many requests. Slow down for a moment.',
  502: 'An upstream service is unavailable.',
};

function fallbackMessage(status: number): string {
  return FALLBACK_MESSAGES[status] ?? 'Something went wrong on our side.';
}

function fallbackCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'invalid_request';
    case 401:
      return 'authentication_required';
    case 403:
      return 'permission_denied';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 422:
      return 'validation_failed';
    case 429:
      return 'rate_limited';
    case 502:
      return 'processor_unavailable';
    default:
      return 'internal_error';
  }
}

/**
 * Builds the concrete error. `headers` is optional so tests and `MockTransport` can map a
 * synthesised failure without fabricating a `Headers` object.
 */
export function toConsoleApiError(parsed: ParsedError, headers?: Headers): ConsoleApiError {
