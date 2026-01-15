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
