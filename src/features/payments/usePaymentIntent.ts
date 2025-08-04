/**
 * `usePaymentIntent(id)` — `GET /v1/payment_intents/:id` (api-surface.md §12).
 *
 * The response carries `client_secret`. The console never renders it and never logs it: it
 * is a browser-side bearer credential for the merchant's own checkout page, and
 * `config/telemetry.config.ts`'s denylist scrubs the field before Sentry sees it.
 */
import { useQuery } from '@tanstack/react-query';

import type { NextAction, PaymentIntent } from '@payzeno/contracts';

import { NotFoundApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';

import { paymentIntentQuery } from './payments.queries';

export interface UsePaymentIntentResult {
  intent: PaymentIntent | undefined;
  /** Non-null exactly when `status === 'requires_action'` — SCA challenge pending. */
  nextAction: NextAction | null;
  isLoading: boolean;
  isMissing: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePaymentIntent(id: string): UsePaymentIntentResult {
  const endpoints = useEndpoints();
  const query = useQuery({ ...paymentIntentQuery(endpoints, id), enabled: id.length > 0 });

  const isMissing = query.error instanceof NotFoundApiError;

  return {
    intent: query.data,
    nextAction: query.data?.next_action ?? null,
    isLoading: query.isLoading,
    isMissing,
    error: isMissing ? null : ((query.error as Error | null) ?? null),
    refetch: () => {
      void query.refetch();
    },
  };
}
