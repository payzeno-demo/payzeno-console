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
