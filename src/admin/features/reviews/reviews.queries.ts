/**
 * Query and mutation factories for risk reviews. The only caller of `AdminReviewsEndpoint`.
 */
import type { Paginated, Review, ReviewListQuery } from '@payzeno/contracts';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import type { AdminEndpointRegistry } from '../../api/endpoints';
import type { ReviewDecision } from '../../api/endpoints/admin-reviews.endpoint';

export function reviewsQuery(e: AdminEndpointRegistry, q: ReviewListQuery = {}) {
  return queryOptions<Paginated<Review>>({
    queryKey: adminQueryKeys.reviews.list(q),
    queryFn: () => e.reviews.list(q),
    placeholderData: keepPreviousData,
    // An open review holds a shopper's money in limbo; keep the queue fresh.
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function reviewQuery(e: AdminEndpointRegistry, reviewId: string) {
  return queryOptions<Review>({
    queryKey: adminQueryKeys.reviews.detail(reviewId),
    queryFn: () => e.reviews.find(reviewId),
    staleTime: 10_000,
  });
}

export interface ReviewDecisionInput {
  reviewId: string;
  decision: ReviewDecision;
  note?: string;
}

/** `POST /v1/admin/reviews/:id/{approve|decline}`. */
export function reviewDecisionMutation(e: AdminEndpointRegistry) {
  return {
    mutationKey: ['admin', 'reviews', 'decision'] as const,
    mutationFn: ({ reviewId, decision, note }: ReviewDecisionInput) =>
      e.reviews.decide(reviewId, decision, note ? { note } : {}),
  };
}
