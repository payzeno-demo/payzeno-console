/**
 * `useCancelPayout()` — `POST /v1/payouts/:payoutId/cancel`.
 *
 * The window is narrow by design: a payout is cancellable while `scheduled` and not a second
 * after it enters `in_transit`, because at that point the file is with the rail. The 409 for
 * that case is the *normal* outcome of clicking cancel a moment too late, so it reads as an
 * explanation rather than an error — and it refetches, so the row updates to `in_transit`
 * under the merchant's cursor.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { Payout } from '@payzeno/contracts';

import { ConflictApiError, ConsoleApiError, ForbiddenError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { cancelPayoutMutation } from './payouts.queries';

export interface UseCancelPayoutResult {
  cancelPayout: (payoutId: string) => void;
  isPending: boolean;
  /** Set when the payout had already left. Not an error — the rail has it. */
  alreadyInTransitId: string | null;
  errorMessage: string | null;
}

export function useCancelPayout(): UseCancelPayoutResult {
  const endpoints = useEndpoints();
  const invalidate = useCallback(
    async (payoutId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payouts.detail(payoutId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.payouts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.balance.all }),
      ]);
    },
    [queryClient],
  );

  const mutation = useMutation({
    ...cancelPayoutMutation(endpoints),
    onMutate: () => {
      setAlreadyInTransitId(null);
      setErrorMessage(null);
    },
    onSuccess: async (payout: Payout) => {
      toast.success('Payout cancelled. The funds stay in your available balance.');
      await invalidate(payout.id);
    },
    onError: async (error: unknown, variables) => {
      if (error instanceof ConflictApiError) {
        setAlreadyInTransitId(variables.payoutId);
        toast.info('This payout has already left — it can no longer be cancelled.');
        await invalidate(variables.payoutId);
        return;
      }

      if (error instanceof ForbiddenError) {
        setErrorMessage('Cancelling a payout needs an admin role.');
        return;
      }

      setErrorMessage(
        error instanceof ConsoleApiError
          ? error.message
          : 'The cancellation could not be sent. Try again in a moment.',
      );
    },
  });

}
