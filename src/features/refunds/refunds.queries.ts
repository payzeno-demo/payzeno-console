/**
 * Query/mutation factories for `features/refunds`. The ONLY caller of `RefundsEndpoint`.
 *
 * A refund is always against a charge, never against a payment intent — `CreateRefundRequest`
 * takes `charge_id`. Cancelling an uncaptured authorisation is a different operation and
 * lives in `features/payments`.
 */
import { queryOptions } from '@tanstack/react-query';

import type { CreateRefundRequest, Paginated, Refund } from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import type { RefundListQuery } from '@api/endpoints/refunds.endpoint';
import { queryKeys } from '@api/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@config/constants';

export function refundsListQuery(e: EndpointRegistry, q?: RefundListQuery) {
  const query: RefundListQuery = { limit: DEFAULT_PAGE_SIZE, ...(q ?? {}) };
  return queryOptions<Paginated<Refund>>({
    queryKey: queryKeys.refunds.list(query),
    queryFn: () => e.refunds.list(query),
    staleTime: 20_000,
  });
}

/**
 * The refunds shown on a charge detail page. Separate factory rather than a filter argument
 * so the key nests under the charge and one refund invalidates exactly one panel.
 */
export function refundsForChargeQuery(e: EndpointRegistry, chargeId: string) {
  return queryOptions<Paginated<Refund>>({
    queryKey: queryKeys.refunds.list({ charge_id: chargeId }),
    queryFn: () => e.refunds.listForCharge(chargeId),
    enabled: chargeId.length > 0,
    staleTime: 30_000,
  });
}

export interface CreateRefundInput {
  request: CreateRefundRequest;
}

/**
 * `POST /v1/refunds`.
 *
 * `ApiClient.post` mints the `Idempotency-Key` per attempt. That matters more here than
 * anywhere else in the console: a double-submitted refund is money out of the merchant's
 * balance twice, and payzeno-api's idempotency table is the only thing standing between an
 * impatient double-click and a support ticket.
