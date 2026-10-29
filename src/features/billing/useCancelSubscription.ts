/**
 * `useCancelSubscription()` — `POST /v1/subscriptions/:id/cancel` (RFC platform-v2 §6).
 *
 * Two shapes. `at_period_end: true` (the api's default, and ours) lets the customer keep what
 * they paid for and stops the next renewal; `false` cancels now — no refund is issued here,
 * that is a separate decision on the payment.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { Subscription } from '@payzeno/contracts';

import { ConflictApiError, ConsoleApiError, ForbiddenError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { cancelSubscriptionMutation } from './billing.queries';

export interface UseCancelSubscriptionResult {
  cancel: (subscriptionId: string, atPeriodEnd: boolean) => void;
  isPending: boolean;
  errorMessage: string | null;
  canceled: Subscription | null;
  reset: () => void;
}

export function useCancelSubscription(): UseCancelSubscriptionResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    ...cancelSubscriptionMutation(endpoints),
    onSuccess: async (subscription: Subscription) => {
      queryClient.setQueryData(queryKeys.subscriptions.detail(subscription.id), subscription);
      toast.success(
        subscription.status === 'canceled'
          ? 'Subscription canceled.'
          : 'Subscription will end at the end of the current period.',
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
    },
  });

  const cancel = useCallback(
    (subscriptionId: string, atPeriodEnd: boolean) =>
      mutation.mutate({ subscriptionId, request: { at_period_end: atPeriodEnd } }),
    [mutation],
  );

  let errorMessage: string | null = null;
  if (mutation.error instanceof ConflictApiError) {
    errorMessage = 'This subscription is already canceled.';
  } else if (mutation.error instanceof ForbiddenError) {
    errorMessage = 'Canceling a subscription needs an owner or admin role.';
  } else if (mutation.error instanceof ConsoleApiError) {
    errorMessage = mutation.error.message;
  } else if (mutation.error) {
    errorMessage = 'The subscription could not be canceled. Try again in a moment.';
  }

  return {
    cancel,
    isPending: mutation.isPending,
    errorMessage,
    canceled: mutation.data ?? null,
    reset: mutation.reset,
  };
}
