/**
 * `useReviews(filters)` — `GET /v1/admin/reviews`. The page defaults the filter to `open`, so
 * the queue is what a risk analyst sees first.
 */
import type { Paginated, Review, ReviewStatus } from '@payzeno/contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { usePagination } from '@hooks/usePagination';
import type { Pagination } from '@hooks/usePagination';

import { useAdminEndpoints } from '../../app/AdminApiContext';

import { reviewsQuery } from './reviews.queries';

export interface UseReviewsResult {
  rows: Review[];
  pagination: Pagination;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useReviews(filters: { status?: ReviewStatus; merchant_id?: string }): UseReviewsResult {
  const endpoints = useAdminEndpoints();
  const latest = useRef<Paginated<Review> | undefined>(undefined);
  const pagination = usePagination<Review>(latest.current);

  const { reset } = pagination;
  const filterKey = `${filters.status ?? ''}|${filters.merchant_id ?? ''}`;
  useEffect(() => {
    reset();
  }, [filterKey, reset]);

  const query = useQuery(
    reviewsQuery(endpoints, {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
      ...pagination.query,
    }),
  );
  latest.current = query.data;

  return {
    rows: query.data?.data ?? [],
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
