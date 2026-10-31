/**
 * `useReviews(q)` — `GET /v1/reviews` (RFC platform-v2 §8).
 *
 * The payments page's "Held for review" view. Read-only: Payzeno risk approves (captures) or
 * declines (voids) from the admin back office; the merchant only ever watches.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { ReviewListQuery } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import type { ReviewRow } from '@/types/view-models';

import { reviewsListQuery } from './payments.queries';

export interface UseReviewsResult {
  rows: ReviewRow[];
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export function useReviews(
  q?: ReviewListQuery,
  options: { enabled?: boolean } = {},
): UseReviewsResult {
  const endpoints = useEndpoints();
  const query = useQuery({ ...reviewsListQuery(endpoints, q), enabled: options.enabled ?? true });

  const rows = useMemo(
    () => (query.data?.data ?? []).map((review) => ({ ...review, _selected: false })),
    [query.data],
  );

  return {
    rows,
    nextCursor: query.data?.next_cursor ?? null,
    hasMore: query.data?.has_more ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
  };
}
