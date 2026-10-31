/**
 * `useAdminMerchants(filters)` — `GET /v1/admin/merchants`, every merchant on the platform.
 *
 * Cursor-paginated like every list route. A filter change sends the list back to page one: the
 * cursor of page three of "pending review" means nothing to "restricted".
 */
import type {
  AdminMerchantListQuery,
  AdminMerchantSummary,
  Paginated,
} from '@payzeno/contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { usePagination } from '@hooks/usePagination';
import type { Pagination } from '@hooks/usePagination';

import { useAdminEndpoints } from '../../app/AdminApiContext';
import { toMerchantRow } from '../../types/admin-views';
import type { AdminMerchantRow } from '../../types/admin-views';

import { adminMerchantsQuery } from './merchants.queries';

export type MerchantFilters = Pick<AdminMerchantListQuery, 'status' | 'onboarding_state' | 'q'>;

export interface UseAdminMerchantsResult {
  rows: AdminMerchantRow[];
  pagination: Pagination;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAdminMerchants(filters: MerchantFilters): UseAdminMerchantsResult {
  const endpoints = useAdminEndpoints();

  const latest = useRef<Paginated<AdminMerchantSummary> | undefined>(undefined);
  const pagination = usePagination<AdminMerchantSummary>(latest.current);

  const filterKey = `${filters.status ?? ''}|${filters.onboarding_state ?? ''}|${filters.q ?? ''}`;
  const { reset } = pagination;
  useEffect(() => {
    reset();
  }, [filterKey, reset]);

  const query = useQuery(
    adminMerchantsQuery(endpoints, {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.onboarding_state ? { onboarding_state: filters.onboarding_state } : {}),
      ...(filters.q ? { q: filters.q } : {}),
      ...pagination.query,
    }),
  );
  latest.current = query.data;

  const rows = useMemo(() => (query.data?.data ?? []).map(toMerchantRow), [query.data]);

  return {
    rows,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
