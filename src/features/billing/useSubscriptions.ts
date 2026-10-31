/**
 * `useSubscriptions(q)` — `GET /v1/subscriptions` (RFC platform-v2 §6).
 *
 * Used by the subscriptions page (status filter) and the customer page (`customer_id`). Rows
 * carry the product name when the prices list is loaded; it is one small page, cached for a
 * minute, so the table does not need a request per row.
 */
import { useQuery } from '@tanstack/react-query';

import type { Subscription, SubscriptionListQuery } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import type { SubscriptionRow } from '@/types/view-models';

import { subscriptionsListQuery } from './billing.queries';
import { usePrices } from './usePrices';

export interface UseSubscriptionsResult {
  rows: SubscriptionRow[];
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export function toSubscriptionRow(
  subscription: Subscription,
  priceLabel: string | null,
): SubscriptionRow {
  return {
    ...subscription,
    _selected: false,
    _priceLabel: priceLabel,
    _isEnding: subscription.status === 'active' && subscription.cancel_at_period_end,
    _isCancelable: subscription.status !== 'canceled',
  };
}

export function useSubscriptions(q?: SubscriptionListQuery): UseSubscriptionsResult {
  const endpoints = useEndpoints();
  const query = useQuery(subscriptionsListQuery(endpoints, q));
  const { byId } = usePrices();

  // Narrowed client-side as well, so a customer page never lists a stranger's subscription if
  // an api build ignores the filter.
  const rows = (query.data?.data ?? [])
    .filter((subscription) => !q?.customer_id || subscription.customer_id === q.customer_id)
    .map((subscription) =>
      toSubscriptionRow(subscription, byId.get(subscription.price_id)?.product_name ?? null),
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
