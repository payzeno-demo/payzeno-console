/**
 * Query and mutation factories for the finance settlement backlog. The only caller of
 * `AdminSettlementsEndpoint`.
 */
import type { ReconciliationItem } from '@payzeno/contracts';
import { queryOptions } from '@tanstack/react-query';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import type { AdminEndpointRegistry } from '../../api/endpoints';
import type { AdminSettlementBacklog } from '../../types/settlement-backlog';

export function settlementBacklogQuery(e: AdminEndpointRegistry) {
  return queryOptions<AdminSettlementBacklog>({
    queryKey: adminQueryKeys.settlements.backlog(),
    queryFn: () => e.settlements.backlog(),
    staleTime: 10_000,
    // The sweep runs every 900s and retries drain continuously; keep the numbers moving.
    refetchInterval: 30_000,
  });
}

export interface RetryBacklogItemInput {
  batchId: string;
  itemId: string;
  /** The item's merchant — the route is merchant-scoped (`?merchant_id=`). */
  merchantId: string;
  reason?: string;
}

/** `POST /v1/settlements/:batchId/items/:itemId/retry` (`finance`). */
export function retryBacklogItemMutation(e: AdminEndpointRegistry) {
  return {
    mutationKey: ['admin', 'settlements', 'retry-item'] as const,
    mutationFn: ({ batchId, itemId, merchantId, reason }: RetryBacklogItemInput): Promise<ReconciliationItem> =>
      e.settlements.retryItem(batchId, itemId, merchantId, reason ? { reason } : {}),
  };
}
