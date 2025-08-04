/**
 * `useCapturePaymentIntent()` — `POST /v1/payment_intents/:id/capture` (api-surface.md §12).
 *
 * Capture is what actually takes the money: the authorisation only reserved it. payzeno-api
 * emits `payment.captured` and posts the capture transaction to the ledger, so a successful
 * capture invalidates charges and balance as well as the intent itself.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { MinorUnits, PaymentIntentResponse } from '@payzeno/contracts';

import { BadRequestApiError, ConflictApiError, ConsoleApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { capturePaymentIntentMutation } from './payments.queries';

export interface CaptureArgs {
  paymentIntentId: string;
  /** Omit for the full authorised amount. Must be <= authorised or the API answers 400. */
  amountMinor?: MinorUnits;
}

export interface UseCapturePaymentIntentResult {
  capture: (args: CaptureArgs) => void;
  isPending: boolean;
  errorMessage: string | null;
}

export function useCapturePaymentIntent(): UseCapturePaymentIntentResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    ...capturePaymentIntentMutation(endpoints),
    onSuccess: async (intent: PaymentIntentResponse) => {
      toast.success('Payment captured.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentIntents.detail(intent.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentIntents.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.charges.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.balance.all }),
      ]);
    },
  });

  const capture = useCallback(
    ({ paymentIntentId, amountMinor }: CaptureArgs) => {
      mutation.mutate({
        paymentIntentId,
        request: amountMinor === undefined ? {} : { amount_minor: amountMinor },
      });
    },
    [mutation],
  );

  const error = mutation.error;
  let errorMessage: string | null = null;

  if (error instanceof ConflictApiError) {
    // `invalid_state` — the authorisation expired or someone captured it in another tab.
    errorMessage = 'This payment can no longer be captured. Refresh to see its current state.';
  } else if (error instanceof BadRequestApiError) {
    errorMessage = error.message;
  } else if (error instanceof ConsoleApiError) {
    errorMessage = error.message;
  } else if (error) {
    errorMessage = 'The capture could not be sent. Try again.';
  }

  return { capture, isPending: mutation.isPending, errorMessage };
}
