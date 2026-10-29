/**
 * Query and mutation factories for `features/billing` (RFC platform-v2 §6). The ONLY callers of
 * `PricesEndpoint` and `SubscriptionsEndpoint`.
 *
 * Billing here is the merchant charging *their* customers (`price_`, `csub_`). Payzeno billing
 * the merchant is `features/invoices`, and the two never share a key.
 */
import { queryOptions } from '@tanstack/react-query';

import type {
  CancelSubscriptionRequest,
  CreatePriceRequest,
  ListQuery,
  Paginated,
  Price,
  Subscription,
  SubscriptionListQuery,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import { queryKeys } from '@api/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@config/constants';

/**
 * Prices are few and change rarely; 100 covers every merchant we have, and the subscription
 * table resolves `price_id` → product name against this one page.
 */
export const PRICE_PAGE_SIZE = 100;

export function pricesListQuery(e: EndpointRegistry, q?: ListQuery) {
  const query: ListQuery = { limit: PRICE_PAGE_SIZE, ...(q ?? {}) };
  return queryOptions<Paginated<Price>>({
    queryKey: queryKeys.prices.list(query),
    queryFn: () => e.prices.list(query),
    staleTime: 60_000,
  });
}

export function priceQuery(e: EndpointRegistry, id: string) {
  return queryOptions<Price>({
    queryKey: queryKeys.prices.detail(id),
    queryFn: () => e.prices.get(id),
    staleTime: 5 * 60_000,
  });
}

export function createPriceMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['prices', 'create'] as const,
    mutationFn: (request: CreatePriceRequest): Promise<Price> => e.prices.create(request),
  };
}

export function subscriptionsListQuery(e: EndpointRegistry, q?: SubscriptionListQuery) {
  const query: SubscriptionListQuery = { limit: DEFAULT_PAGE_SIZE, ...(q ?? {}) };
  return queryOptions<Paginated<Subscription>>({
    queryKey: queryKeys.subscriptions.list(query),
    queryFn: () => e.subscriptions.list(query),
    staleTime: 20_000,
  });
}

export function subscriptionQuery(e: EndpointRegistry, id: string) {
  return queryOptions<Subscription>({
    queryKey: queryKeys.subscriptions.detail(id),
    queryFn: () => e.subscriptions.get(id),
    staleTime: 10_000,
  });
}

export interface CancelSubscriptionInput {
  subscriptionId: string;
  request: CancelSubscriptionRequest;
}

export function cancelSubscriptionMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['subscriptions', 'cancel'] as const,
    mutationFn: ({ subscriptionId, request }: CancelSubscriptionInput): Promise<Subscription> =>
      e.subscriptions.cancel(subscriptionId, request),
  };
}
