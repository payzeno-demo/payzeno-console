/**
 * `usePaymentIntents(q)` — `GET /v1/payment_intents` (api-surface.md §12).
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PaymentIntent, PaymentIntentListQuery } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import type { PaymentIntentRow } from '@types/view-models';

import { paymentIntentsListQuery } from './payments.queries';

export interface UsePaymentIntentsResult {
  rows: PaymentIntentRow[];
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

function toRow(intent: PaymentIntent): PaymentIntentRow {
  return {
    ...intent,
    _selected: false,
    // Only a manual-capture intent sitting in `requires_capture` has a capture button.
    _isCapturable: intent.status === 'requires_capture' && intent.capture_method === 'manual',
    // Cancelling voids the authorisation. A succeeded intent is past that point.
    _isCancelable:
      intent.status === 'requires_capture' ||
      intent.status === 'requires_confirmation' ||
      intent.status === 'requires_action',
    _needsCustomerAction: intent.status === 'requires_action',
  };
}

export function usePaymentIntents(q?: PaymentIntentListQuery): UsePaymentIntentsResult {
  const endpoints = useEndpoints();
  const query = useQuery(paymentIntentsListQuery(endpoints, q));

  const rows = useMemo(() => (query.data?.data ?? []).map(toRow), [query.data]);

  return {
    rows,
    nextCursor: query.data?.next_cursor ?? null,
    hasMore: query.data?.has_more ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
  };
}
