/**
 * Query factories for `features/balance`. The ONLY caller of `BalanceEndpoint`.
 *
 * Balance is a singleton per (merchant, currency): there is no list and no id, which is why
 * `BalanceEndpoint` is not a `ResourceEndpoint`. payzeno-api reads it through to the ledger's
 * `GET /internal/v1/balances/:merchantId`, so a slow ledger shows up here first.
 */
import { queryOptions } from '@tanstack/react-query';

import type { Balance, CurrencyCode } from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import type { BalanceListResponse } from '@api/endpoints/balance.endpoint';
import { queryKeys } from '@api/queryKeys';

/**
 * 30s stale time. Anything shorter hammers the ledger from every open dashboard; anything
 * longer and a merchant who just issued a refund does not see it move, then files a ticket.
 * The refund mutation invalidates this key explicitly, which is what actually keeps it honest.
 */
export function balanceQuery(e: EndpointRegistry, currency: CurrencyCode) {
  return queryOptions<Balance>({
    queryKey: queryKeys.balance.current(currency),
    queryFn: () => e.balance.get(currency),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * `GET /v1/balance` without `currency` — every currency balance (RFC platform-v2 §7). Same
 * stale time and the same invalidation family as the single-currency read.
 */
export function allBalancesQuery(e: EndpointRegistry) {
  return queryOptions<BalanceListResponse>({
    queryKey: queryKeys.balance.list(),
    queryFn: () => e.balance.list(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
