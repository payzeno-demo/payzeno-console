/**
 * Query/mutation factories for `features/settlements`. The ONLY caller of
 * `SettlementsEndpoint` in the repo.
 *
 * Renamed from `settlementQueries.ts` in the PAY-2043 PR, along with five sibling files —
 * `rrefactor` does not do small diffs.
 */
import { queryOptions } from '@tanstack/react-query';

import type {
  MerchantSettlementBatch,
  Paginated,
  ReconciliationItem,
  RetryReconciliationItemRequest,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import type {
  SettlementItemListQuery,
  SettlementListQuery,
} from '@api/endpoints/settlements.endpoint';
import { queryKeys } from '@api/queryKeys';
import { SETTLEMENT_ITEM_PAGE_SIZE } from '@config/constants';

export function settlementsListQuery(e: EndpointRegistry, q?: SettlementListQuery) {
  return queryOptions<Paginated<MerchantSettlementBatch>>({
    queryKey: queryKeys.settlements.list(q),
    queryFn: () => e.settlements.list(q),
    staleTime: 60_000,
  });
}

export function settlementQuery(e: EndpointRegistry, batchId: string) {
  return queryOptions<MerchantSettlementBatch>({
    queryKey: queryKeys.settlements.detail(batchId),
    queryFn: () => e.settlements.get(batchId),
    // A batch only 404s when this merchant has no item in it, and that does not change.
    retry: 1,
    staleTime: 30_000,
  });
}

/**
 * arc PERF (PAY-1918): the page size was 500 and the ledger's `list_items` started timing
 * out on month-end batches. It is now `SETTLEMENT_ITEM_PAGE_SIZE` (50) with a cursor, and
 * the endpoint sends `LONG_READ_TIMEOUT_MS` because the ledger's own read budget for this
 * route is 30s.
 */
export function settlementItemsQuery(
  e: EndpointRegistry,
  batchId: string,
  q?: SettlementItemListQuery,
) {
  const query: SettlementItemListQuery = { limit: SETTLEMENT_ITEM_PAGE_SIZE, ...(q ?? {}) };
  return queryOptions<Paginated<ReconciliationItem>>({
    queryKey: queryKeys.settlements.items(batchId, query),
    queryFn: () => e.settlements.listItems(batchId, query),
    staleTime: 15_000,
  });
}

export interface RetryItemInput {
  batchId: string;
  itemId: string;
  request: RetryReconciliationItemRequest;
}

/**
