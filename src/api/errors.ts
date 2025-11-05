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

