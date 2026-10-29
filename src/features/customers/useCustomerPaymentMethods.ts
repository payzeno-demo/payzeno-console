/**
 * `useCustomerPaymentMethods(customer)` — `GET /v1/customers/:id/payment_methods` (§5).
 *
 * A saved card is a `CardSummary` and a `pm_` id; the vault token behind it never reaches the
 * console (ADR 0003).
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Customer, PaymentMethod } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import type { PaymentMethodRow } from '@/types/view-models';

import { paymentMethodsQuery } from './customers.queries';

export interface UseCustomerPaymentMethodsResult {
  rows: PaymentMethodRow[];
  isLoading: boolean;
  error: Error | null;
}

/** A card is expired once its expiry month is over. */
export function isExpired(method: PaymentMethod, now: Date = new Date()): boolean {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  return (
    method.card.exp_year < year || (method.card.exp_year === year && method.card.exp_month < month)
  );
}

export function useCustomerPaymentMethods(
  customer: Pick<Customer, 'id' | 'default_payment_method_id'> | undefined,
): UseCustomerPaymentMethodsResult {
  const endpoints = useEndpoints();
  const customerId = customer?.id ?? '';
  const query = useQuery({
    ...paymentMethodsQuery(endpoints, customerId),
    enabled: customerId.length > 0,
  });
  const defaultId = customer?.default_payment_method_id ?? null;

  const rows = useMemo(
    () =>
      (query.data?.data ?? []).map((method) => ({
        ...method,
        _isDefault: method.id === defaultId,
        _isExpired: isExpired(method),
      })),
    [query.data, defaultId],
  );

  return {
    rows,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}
