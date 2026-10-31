/**
 * `useAdminDisputes(filters)` — `GET /v1/admin/disputes`, every merchant's disputes.
 */
import type { Dispute, DisputeStatus, Paginated } from '@payzeno/contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { usePagination } from '@hooks/usePagination';
import type { Pagination } from '@hooks/usePagination';

import { useAdminEndpoints } from '../../app/AdminApiContext';

import { adminDisputesQuery } from './disputes.queries';

export interface UseAdminDisputesResult {
  rows: Dispute[];
  pagination: Pagination;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAdminDisputes(filters: { status?: DisputeStatus }): UseAdminDisputesResult {
  const endpoints = useAdminEndpoints();
  const latest = useRef<Paginated<Dispute> | undefined>(undefined);
  const pagination = usePagination<Dispute>(latest.current);

  const { reset } = pagination;
  useEffect(() => {
    reset();
  }, [filters.status, reset]);

  const query = useQuery(
    adminDisputesQuery(endpoints, {
      ...(filters.status ? { status: filters.status } : {}),
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
