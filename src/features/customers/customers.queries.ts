/**
 * Query and mutation factories for `features/customers` (RFC platform-v2 §5). The ONLY caller
 * of `CustomersEndpoint`.
 */
import { queryOptions } from '@tanstack/react-query';

import type { Customer, CustomerListQuery, Paginated, PaymentMethod } from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import { queryKeys } from '@api/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@config/constants';

export function customersListQuery(e: EndpointRegistry, q?: CustomerListQuery) {
  const query: CustomerListQuery = { limit: DEFAULT_PAGE_SIZE, ...(q ?? {}) };
  return queryOptions<Paginated<Customer>>({
    queryKey: queryKeys.customers.list(query),
    queryFn: () => e.customers.list(query),
    staleTime: 20_000,
  });
}

export function customerQuery(e: EndpointRegistry, id: string) {
  return queryOptions<Customer>({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => e.customers.get(id),
    staleTime: 20_000,
  });
}

export function paymentMethodsQuery(e: EndpointRegistry, customerId: string) {
  return queryOptions<Paginated<PaymentMethod>>({
    queryKey: queryKeys.customers.paymentMethods(customerId),
    queryFn: () => e.customers.listPaymentMethods(customerId),
    staleTime: 20_000,
  });
}

export interface RemovePaymentMethodInput {
  customerId: string;
  paymentMethodId: string;
}

export function removePaymentMethodMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['customers', 'remove-payment-method'] as const,
    mutationFn: ({ customerId, paymentMethodId }: RemovePaymentMethodInput): Promise<void> =>
      e.customers.removePaymentMethod(customerId, paymentMethodId),
  };
}
