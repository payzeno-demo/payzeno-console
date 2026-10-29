/**
 * `usePaymentIntents(q)` — `GET /v1/payment_intents` (api-surface.md §12).
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PaymentIntent, PaymentIntentListQuery } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import type { PaymentIntentRow } from '@/types/view-models';

import { paymentIntentsListQuery } from './payments.queries';

export interface UsePaymentIntentsResult {
  rows: PaymentIntentRow[];
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

/** See `PaymentIntentRow._reviewState`. */
export function reviewStateOf(intent: PaymentIntent): PaymentIntentRow['_reviewState'] {
  if (!intent.review_id) return null;
  return intent.status === 'requires_capture' ? 'held' : 'reviewed';
}

function toRow(intent: PaymentIntent): PaymentIntentRow {
  return {
    ...intent,
    _selected: false,
    // Only a manual-capture intent sitting in `requires_capture` has a capture button — and
    // never one held for review, which Payzeno risk captures or declines (RFC platform-v2 §8).
    _isCapturable:
      intent.status === 'requires_capture' &&
      intent.capture_method === 'manual' &&
      reviewStateOf(intent) !== 'held',
    // Cancelling voids the authorisation. A succeeded intent is past that point.
    _isCancelable:
      intent.status === 'requires_capture' ||
      intent.status === 'requires_confirmation' ||
      intent.status === 'requires_action',
    _needsCustomerAction: intent.status === 'requires_action',
    _reviewState: reviewStateOf(intent),
  };
}

export interface UsePaymentIntentsOptions {
  enabled?: boolean;
  /**
   * Keep only this customer's payments (RFC platform-v2 §5). Client-side on purpose:
   * `GET /v1/payment_intents` has no `customer_id` filter and rejects unknown parameters with
   * a 422, so the customer page narrows the page it fetched instead of asking the api to.
   */
  customerId?: string;
}

export function usePaymentIntents(
  q?: PaymentIntentListQuery,
  options: UsePaymentIntentsOptions = {},
): UsePaymentIntentsResult {
  const endpoints = useEndpoints();
  const query = useQuery({
    ...paymentIntentsListQuery(endpoints, q),
    enabled: options.enabled ?? true,
  });

  const rows = useMemo(
    () =>
      (query.data?.data ?? [])
        .filter((intent) => !options.customerId || intent.customer_id === options.customerId)
        .map(toRow),
    [query.data, options.customerId],
  );

  return {
    rows,
    nextCursor: query.data?.next_cursor ?? null,
    hasMore: query.data?.has_more ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
  };
}
