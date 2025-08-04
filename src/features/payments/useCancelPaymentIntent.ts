/**
 * `useCancelPaymentIntent()` — `POST /v1/payment_intents/:id/cancel` (api-surface.md §12).
 *
 * Cancelling voids the authorisation, which is **not** a refund (domain-model.md §4).
 * `POST /v1/refunds` rejects an uncaptured charge outright, so this is the only way to
 * release a hold, and it is the reason the UI keeps the two verbs visibly separate.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { CancellationReason, PaymentIntentResponse } from '@payzeno/contracts';

import { ConflictApiError, ConsoleApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { cancelPaymentIntentMutation } from './payments.queries';

export interface CancelArgs {
  paymentIntentId: string;
  reason?: CancellationReason;
}

export interface UseCancelPaymentIntentResult {
  cancel: (args: CancelArgs) => void;
  isPending: boolean;
  errorMessage: string | null;
}

export function useCancelPaymentIntent(): UseCancelPaymentIntentResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    ...cancelPaymentIntentMutation(endpoints),
    onSuccess: async (intent: PaymentIntentResponse) => {
      toast.success('Authorisation released.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentIntents.detail(intent.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentIntents.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.balance.all }),
      ]);
    },
  });

  const cancel = useCallback(
    ({ paymentIntentId, reason }: CancelArgs) => {
      mutation.mutate({
        paymentIntentId,
        request: reason ? { cancellation_reason: reason } : {},
      });
    },
    [mutation],
  );

  const error = mutation.error;
  let errorMessage: string | null = null;

  if (error instanceof ConflictApiError) {
    errorMessage = 'This payment is past the point where it can be cancelled.';
  } else if (error instanceof ConsoleApiError) {
    errorMessage = error.message;
  } else if (error) {
    errorMessage = 'The cancellation could not be sent. Try again.';
  }

  return { cancel, isPending: mutation.isPending, errorMessage };
}
