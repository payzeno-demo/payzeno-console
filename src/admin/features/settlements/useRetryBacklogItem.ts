/**
 * `useRetryBacklogItem()` — `POST /v1/settlements/:batchId/items/:itemId/retry` (finance).
 *
 * Same rule as the merchant console's `useRetrySettlementItem`: `409 settlement_locked` is the
 * normal outcome of a manual retry racing the reconciliation sweep (PAY-2043). It is reported as
 * "already being settled", the backlog is refetched, and it is not an error.
 */
import { ConflictApiError } from '@api/errors';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import { useAdminEndpoints } from '../../app/AdminApiContext';
import { useStaffAction } from '../../hooks/useStaffAction';
import type { StaffActionResult } from '../../hooks/useStaffAction';

import { retryBacklogItemMutation } from './settlements.queries';
import type { RetryBacklogItemInput } from './settlements.queries';

export function useRetryBacklogItem(): StaffActionResult<RetryBacklogItemInput> {
  const endpoints = useAdminEndpoints();

  return useStaffAction({
    ...retryBacklogItemMutation(endpoints),
    invalidate: () => [adminQueryKeys.settlements.all],
    success: (item) => ({
      tone: 'success',
      title: `Retry queued for ${item.id}`,
      body: `Batch ${item.batch_id}: the item is now ${item.status} (attempt ${item.attempt_count}). The ledger settles it asynchronously.`,
    }),
    expectedError: (error, vars) =>
      error instanceof ConflictApiError && error.isSettlementLocked()
        ? {
            tone: 'info',
            title: `Already being settled: ${vars.itemId}`,
            body: 'A reconciliation sweep holds this batch right now, so the item is already being worked. Nothing else to do.',
          }
        : null,
    forbidden: 'retrying a settlement item needs the finance role.',
  });
}
