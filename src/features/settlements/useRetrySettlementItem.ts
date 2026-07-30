/**
 * `useRetrySettlementItem()` — `POST /v1/settlements/:batchId/items/:itemId/retry`.
 *
 * THE arc-INC hook.
 *
 * `409 settlement_locked` is a **no-op, not a failure**. The ledger's `RetryScheduler` takes
 * the batch advisory lock before it claims the item (PAY-2043); when a reconciliation sweep
 * already holds it, `retry_item` returns `None` and the route answers 409 with the current
 * item in `error.details.item`. Before PAY-2043 that only happened when the item was already
 * settled, so this hook toasted an error. After PAY-2043 it is the *normal* outcome of a
 * manual retry racing the 900s sweep, and toasting an error for it trained finance to ignore
 * the toast.
 *
 * So: show "already being settled", refetch the item, and do not surface an error.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { ReconciliationItem } from '@payzeno/contracts';

import { ConflictApiError, ConsoleApiError, ForbiddenError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { retrySettlementItemMutation } from './settlements.queries';

export interface RetryItemArgs {
  batchId: string;
  itemId: string;
  reason?: string;
}

export interface UseRetrySettlementItemResult {
  retry: (args: RetryItemArgs) => void;
  isPending: boolean;
  /** Set when the last attempt lost the race to a sweep. Not an error. */
  lockedItemId: string | null;
  errorMessage: string | null;
}

export function useRetrySettlementItem(): UseRetrySettlementItemResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [lockedItemId, setLockedItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const invalidateBatch = useCallback(
    async (batchId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.settlements.items(batchId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.settlements.detail(batchId) }),
      ]);
    },
    [queryClient],
  );

  const mutation = useMutation({
    ...retrySettlementItemMutation(endpoints),
    onMutate: () => {
      setLockedItemId(null);
      setErrorMessage(null);
    },
    onSuccess: async (item: ReconciliationItem, variables) => {
      toast.success(`Retry queued for ${item.id}.`);
      await invalidateBatch(variables.batchId);
    },
    onError: async (error: unknown, variables) => {
      // The no-op branch. Refetch so the row shows whatever the sweep just did to it.
      if (error instanceof ConflictApiError && error.isSettlementLocked()) {
        setLockedItemId(variables.itemId);
        toast.info('This item is already being settled — refreshing.');
        await invalidateBatch(variables.batchId);
        return;
      }

      if (error instanceof ForbiddenError) {
        setErrorMessage('Retrying a settlement item needs the finance role.');
        return;
      }

      if (error instanceof ConsoleApiError) {
        setErrorMessage(error.message);
        toast.error(error.message);
        return;
      }

      setErrorMessage('The retry could not be sent. Try again in a moment.');
    },
  });

  const retry = useCallback(
    ({ batchId, itemId, reason }: RetryItemArgs) => {
      mutation.mutate({ batchId, itemId, request: reason ? { reason } : {} });
    },
    [mutation],
  );

  return { retry, isPending: mutation.isPending, lockedItemId, errorMessage };
}
