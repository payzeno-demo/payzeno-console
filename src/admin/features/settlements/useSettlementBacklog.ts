/**
 * `useSettlementBacklog()` — `GET /v1/admin/settlements/backlog`: how much is waiting to
 * settle, in which states, and how long the oldest retry has been due.
 */
import { useQuery } from '@tanstack/react-query';

import { useAdminEndpoints } from '../../app/AdminApiContext';
import type { AdminSettlementBacklog } from '../../types/settlement-backlog';

import { settlementBacklogQuery } from './settlements.queries';

export interface UseSettlementBacklogResult {
  backlog: AdminSettlementBacklog | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSettlementBacklog(options: { enabled?: boolean } = {}): UseSettlementBacklogResult {
  const endpoints = useAdminEndpoints();
  const query = useQuery({ ...settlementBacklogQuery(endpoints), enabled: options.enabled ?? true });

  return {
    backlog: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
