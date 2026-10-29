/**
 * `useSupportTasks(filters)` — `GET /v1/admin/support-tasks`: the work the platform opened for a
 * person (duplicate settlements, ledger imbalances, returned payouts, dunning escalations).
 */
import type { Paginated, SupportTask, SupportTaskStatus } from '@payzeno/contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { usePagination } from '@hooks/usePagination';
import type { Pagination } from '@hooks/usePagination';

import { useAdminEndpoints } from '../../app/AdminApiContext';

import { supportTasksQuery } from './support.queries';

export interface UseSupportTasksResult {
  rows: SupportTask[];
  pagination: Pagination;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSupportTasks(filters: { status?: SupportTaskStatus }): UseSupportTasksResult {
  const endpoints = useAdminEndpoints();
  const latest = useRef<Paginated<SupportTask> | undefined>(undefined);
  const pagination = usePagination<SupportTask>(latest.current);

  const { reset } = pagination;
  useEffect(() => {
    reset();
  }, [filters.status, reset]);

  const query = useQuery(
    supportTasksQuery(endpoints, {
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
