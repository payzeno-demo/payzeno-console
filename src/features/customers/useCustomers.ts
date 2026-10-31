/**
 * `useCustomers(q)` — `GET /v1/customers?email=` (RFC platform-v2 §5).
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CustomerListQuery } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import type { CustomerRow } from '@/types/view-models';

import { customerLabel } from './customer-label';
import { customersListQuery } from './customers.queries';

export interface UseCustomersResult {
  rows: CustomerRow[];
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export function useCustomers(q?: CustomerListQuery): UseCustomersResult {
  const endpoints = useEndpoints();
  const query = useQuery(customersListQuery(endpoints, q));

  const rows = useMemo(
    () =>
      (query.data?.data ?? []).map((customer) => ({
        ...customer,
        _selected: false,
        _label: customerLabel(customer),
      })),
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
