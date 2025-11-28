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
