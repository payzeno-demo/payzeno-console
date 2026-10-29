/**
 * `useSubscription(id)` — `GET /v1/subscriptions/:subscriptionId` (RFC platform-v2 §6).
 */
import { useQuery } from '@tanstack/react-query';

import type { Subscription } from '@payzeno/contracts';

import { NotFoundApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';

import { subscriptionQuery } from './billing.queries';

export interface UseSubscriptionResult {
  subscription: Subscription | undefined;
  isLoading: boolean;
  isMissing: boolean;
  error: Error | null;
}

export function useSubscription(id: string): UseSubscriptionResult {
  const endpoints = useEndpoints();
  const query = useQuery({ ...subscriptionQuery(endpoints, id), enabled: id.length > 0 });
  const isMissing = query.error instanceof NotFoundApiError;

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    isMissing,
    error: isMissing ? null : (query.error as Error | null) ?? null,
  };
}
