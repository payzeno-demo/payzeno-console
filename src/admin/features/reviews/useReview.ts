/**
 * `useReview(id)` — one review. There is no `GET /v1/admin/reviews/:id` in the RFC, so this
 * resolves through `AdminReviewsEndpoint.find`, which walks the list. Seeded from any list page
 * already in the cache, so opening a row from the queue renders immediately.
 */
import type { Paginated, Review } from '@payzeno/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import { useAdminEndpoints } from '../../app/AdminApiContext';

import { reviewQuery } from './reviews.queries';

export interface UseReviewResult {
  review: Review | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useReview(reviewId: string): UseReviewResult {
  const endpoints = useAdminEndpoints();
  const queryClient = useQueryClient();

  const query = useQuery({
    ...reviewQuery(endpoints, reviewId),
    initialData: () => {
      for (const [, page] of queryClient.getQueriesData<Paginated<Review>>({
        queryKey: adminQueryKeys.reviews.lists,
      })) {
        const found = page?.data?.find((review) => review.id === reviewId);
        if (found) return found;
      }
      return undefined;
    },
    initialDataUpdatedAt: () => {
      const states = queryClient
        .getQueryCache()
        .findAll({ queryKey: adminQueryKeys.reviews.lists })
        .map((entry) => entry.state.dataUpdatedAt);
      return states.length > 0 ? Math.max(...states) : undefined;
    },
  });

  return {
    review: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
