/**
 * Query and mutation factories for cross-merchant disputes. The only caller of
 * `AdminDisputesEndpoint`.
 */
import type { Dispute, Paginated } from '@payzeno/contracts';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import type { AdminEndpointRegistry } from '../../api/endpoints';
import type { AdminDisputeListQuery } from '../../types/admin-views';

export function adminDisputesQuery(e: AdminEndpointRegistry, q: AdminDisputeListQuery = {}) {
  return queryOptions<Paginated<Dispute>>({
    queryKey: adminQueryKeys.disputes.list(q),
    queryFn: () => e.disputes.list(q),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export interface AcceptDisputeInput {
  disputeId: string;
  /** The dispute's merchant — the route is merchant-scoped (`?merchant_id=`). */
  merchantId: string;
}

/** `POST /v1/disputes/:id/accept` — concede on the merchant's behalf (`risk`). */
export function acceptDisputeMutation(e: AdminEndpointRegistry) {
  return {
    mutationKey: ['admin', 'disputes', 'accept'] as const,
    mutationFn: ({ disputeId, merchantId }: AcceptDisputeInput) =>
      e.disputes.accept(disputeId, merchantId),
  };
}
