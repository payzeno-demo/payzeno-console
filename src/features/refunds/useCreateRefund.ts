/**
 * `useCreateRefund()` — `POST /v1/refunds` (api-surface.md §12).
 *
 * Three failures matter and each renders differently:
 *   422 `refund_window_closed`     — past `REFUND_WINDOW_DAYS`; nothing the merchant can do
 *                                    from here, so say so instead of offering a retry.
 *   422 `refund_amount_exceeded`   — field-level; maps onto the amount input.
 *   409 `invalid_state`            — the charge is authorised, not captured. That is a
 *                                    cancellation, not a refund, and the copy says which.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { CreateRefundRequest, MinorUnits, Refund } from '@payzeno/contracts';

import {
  ConflictApiError,
  ConsoleApiError,
  ForbiddenError,
  ValidationApiError,
} from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';
import { trackEvent } from '@lib/telemetry';
