/**
 * Query/mutation factories for `features/payouts`. The ONLY caller of `PayoutsEndpoint`.
 *
 * Every route here is a read-through to payzeno-ledger via payzeno-api: the ledger owns
 * payouts, the API owns the merchant scope. That is why a payout mutation invalidates the
 * balance too — the two live in the same double-entry world and a payout moves
 * `merchant_payable` into `payout_clearing`.
 */
import { queryOptions } from '@tanstack/react-query';

import type { CreatePayoutRequest, Paginated, Payout } from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import type { PayoutListQuery } from '@api/endpoints/payouts.endpoint';
import { queryKeys } from '@api/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@config/constants';

export function payoutsListQuery(e: EndpointRegistry, q?: PayoutListQuery) {
  const query: PayoutListQuery = { limit: DEFAULT_PAGE_SIZE, ...(q ?? {}) };
  return queryOptions<Paginated<Payout>>({
    queryKey: queryKeys.payouts.list(query),
    queryFn: () => e.payouts.list(query),
    staleTime: 30_000,
  });
}

export function payoutQuery(e: EndpointRegistry, payoutId: string) {
  return queryOptions<Payout>({
    queryKey: queryKeys.payouts.detail(payoutId),
    queryFn: () => e.payouts.get(payoutId),
    enabled: payoutId.length > 0,
    staleTime: 15_000,
  });
}

/** The failed-payout bucket the `payout.failed` notification links to. */
export function failedPayoutsQuery(e: EndpointRegistry, currency?: PayoutListQuery['currency']) {
  return queryOptions<Paginated<Payout>>({
    queryKey: queryKeys.payouts.list({ status: 'failed', currency, limit: 20 }),
    queryFn: () => e.payouts.listFailed(currency),
    staleTime: 60_000,
  });
}

export interface CreatePayoutInput {
  request: CreatePayoutRequest;
}

export function createPayoutMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['payouts', 'create'] as const,
    mutationFn: ({ request }: CreatePayoutInput): Promise<Payout> => e.payouts.create(request),
  };
}

/**
 * `POST /v1/payouts/:payoutId/cancel`. Only a `scheduled` payout can be cancelled — once the
 * rail has it (`in_transit`) the answer is `409 invalid_state` and the only remedy is a
 * return, which takes days.
 */
export function cancelPayoutMutation(e: EndpointRegistry) {
