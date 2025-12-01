/**
 * Query/mutation factories for `features/disputes`. The ONLY caller of `DisputesEndpoint`.
 *
 * `POST /v1/disputes/:id/accept` is staff-only and has no factory here on purpose — a
 * merchant cannot accept its own dispute from this console, and a factory for a route the
 * session can never call is a trap for whoever wires the next button.
 */
import { queryOptions } from '@tanstack/react-query';

import type {
  Dispute,
  Paginated,
  SubmitDisputeEvidenceRequest,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import type { DisputeListQuery } from '@api/endpoints/disputes.endpoint';
import { queryKeys } from '@api/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@config/constants';

export function disputesListQuery(e: EndpointRegistry, q?: DisputeListQuery) {
  const query: DisputeListQuery = { limit: DEFAULT_PAGE_SIZE, ...(q ?? {}) };
  return queryOptions<Paginated<Dispute>>({
    queryKey: queryKeys.disputes.list(query),
    queryFn: () => e.disputes.list(query),
    // The evidence clock is the reason this is short: a stale "3 days left" is worse than a
    // spinner.
    staleTime: 30_000,
  });
}

export function disputeQuery(e: EndpointRegistry, disputeId: string) {
  return queryOptions<Dispute>({
    queryKey: queryKeys.disputes.detail(disputeId),
    queryFn: () => e.disputes.get(disputeId),
    enabled: disputeId.length > 0,
    staleTime: 30_000,
  });
