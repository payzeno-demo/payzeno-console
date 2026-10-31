/**
 * `useRemovePaymentMethod()` — `DELETE /v1/customers/:id/payment_methods/:pm` (RFC §5).
 *
 * Removing the card a subscription renews on is allowed — the api falls back to the customer's
 * default, and the next renewal fails if there is none. The confirm dialog says so; this hook
 * just does it and refreshes the customer (whose default may have changed) and its cards.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { ConsoleApiError, ForbiddenError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { removePaymentMethodMutation } from './customers.queries';

export interface UseRemovePaymentMethodResult {
  remove: (paymentMethodId: string) => void;
  isPending: boolean;
  /** The card being removed, so only its row shows a spinner. */
  pendingId: string | null;
  errorMessage: string | null;
  isDone: boolean;
  reset: () => void;
}

export function useRemovePaymentMethod(customerId: string): UseRemovePaymentMethodResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    ...removePaymentMethodMutation(endpoints),
    onSuccess: async () => {
      toast.success('Card removed.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.paymentMethods(customerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) }),
      ]);
    },
  });

  const remove = useCallback(
    (paymentMethodId: string) => mutation.mutate({ customerId, paymentMethodId }),
    [mutation, customerId],
  );

  let errorMessage: string | null = null;
  if (mutation.error instanceof ForbiddenError) {
    errorMessage = 'Removing a saved card needs an owner or admin role.';
  } else if (mutation.error instanceof ConsoleApiError) {
    errorMessage = mutation.error.message;
  } else if (mutation.error) {
    errorMessage = 'The card could not be removed. Try again in a moment.';
  }

  return {
    remove,
    isPending: mutation.isPending,
    pendingId: mutation.isPending ? mutation.variables?.paymentMethodId ?? null : null,
    errorMessage,
    isDone: mutation.isSuccess,
    reset: mutation.reset,
  };
}
