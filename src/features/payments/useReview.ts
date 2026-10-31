/**
 * `useReview(id)` — `GET /v1/reviews/:reviewId` (RFC platform-v2 §8).
 *
 * Fetched only when the payment names one (`payment_intent.review_id`), so a payment that was
 * never held costs no request.
 */
import { useQuery } from '@tanstack/react-query';

import type { Review } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';

import { reviewQuery } from './payments.queries';

export interface UseReviewResult {
  review: Review | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useReview(id: string | null): UseReviewResult {
  const endpoints = useEndpoints();
  const query = useQuery({ ...reviewQuery(endpoints, id ?? ''), enabled: Boolean(id) });

  return {
    review: query.data,
    isLoading: Boolean(id) && query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}
