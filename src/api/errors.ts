/**
 * The console's HTTP error hierarchy — interfaces.md §4.3, frozen.
 *
 * `ConsoleApiError extends PayzenoError` from `@payzeno/contracts`, which is what makes the
 * inheritance chain cross a repo boundary. Every subclass below exists even when it is
 * constructed in exactly one place.
 *
 * Construction site: `src/api/http/error-mapper.ts`, and nowhere else.
 * Render site: `src/components/feedback/ErrorBoundary.tsx`, and nowhere else.
 */
import type { ApiError, ErrorCode, FieldError } from '@payzeno/contracts';
import { PayzenoError } from '@payzeno/contracts/errors';

export interface ConsoleApiErrorInit {
  status: number;
  code: ErrorCode;
  message: string;
  requestId: string;
  fieldErrors?: FieldError[];
  retryAfterSeconds?: number;
  details?: Record<string, unknown>;
}

export class ConsoleApiError extends PayzenoError {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly status: number;
  readonly requestId: string;
  readonly fieldErrors: FieldError[];
  readonly retryAfterSeconds: number | null;

  constructor(init: ConsoleApiErrorInit) {
    super(init.message, init.details ?? {});
    this.name = new.target.name;
    this.code = init.code;
    this.status = init.status;
    this.httpStatus = init.status;
    this.requestId = init.requestId;
    this.fieldErrors = init.fieldErrors ?? [];
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
  }

  /** Field errors indexed by their dotted path, for `mapFieldErrorsToForm`. */
  fieldErrorMap(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const fe of this.fieldErrors) out[fe.path] = fe.message;
    return out;
  }

  /** True when a retry of the same request could plausibly succeed. */
  isTransient(): boolean {
    return this.status === 429 || this.status === 502 || this.status >= 503;
  }
}

export class BadRequestApiError extends ConsoleApiError {}

export class UnauthorizedError extends ConsoleApiError {}

export class ForbiddenError extends ConsoleApiError {}

export class NotFoundApiError extends ConsoleApiError {}

/**
 * 409. `code` is the discriminator `features/settlements/useRetrySettlementItem.ts` reads:
 * `settlement_locked` is a no-op, not a failure (the-incident.md §8, PAY-2043).
 */
export class ConflictApiError extends ConsoleApiError {
  isSettlementLocked(): boolean {
    return this.code === 'settlement_locked';
  }

  isIdempotencyInProgress(): boolean {
    return this.code === 'idempotency_in_progress';
  }
}

export class ValidationApiError extends ConsoleApiError {}

export class RateLimitedApiError extends ConsoleApiError {
  /** Seconds until the bucket refills. Defaults to 30 when the header was absent. */
  get retryAfter(): number {
    return this.retryAfterSeconds ?? 30;
  }
}

export class UpstreamUnavailableApiError extends ConsoleApiError {}

export class ServerError extends ConsoleApiError {}

/** Narrowing helper used by query retry policy, hooks and the error boundary. */
