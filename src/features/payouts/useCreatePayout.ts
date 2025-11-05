/**
 * `useCreatePayout()` — `POST /v1/payouts` (api-surface.md §12).
 *
 * The failures that actually happen, in order of frequency:
 *   409 `payout_blocked`     — the merchant's balance is negative, or the account is frozen.
 *   422 `currency_mismatch`  — the chosen bank account is not in the payout currency. Payzeno
 *                              does not convert; this is a real constraint, not a validator
 *                              being fussy.
 *   403                      — `payouts:write` is admin-only.
 *
 * Each gets its own sentence, because "Something went wrong" on a payout form generates a
 * support ticket every single time.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type {
  CreatePayoutRequest,
  CurrencyCode,
  MinorUnits,
  Payout,
  PayoutMethod,
} from '@payzeno/contracts';

import {
  ConflictApiError,
  ConsoleApiError,
  ForbiddenError,
  ValidationApiError,
} from '@api/errors';
import { queryKeys } from '@api/queryKeys';
