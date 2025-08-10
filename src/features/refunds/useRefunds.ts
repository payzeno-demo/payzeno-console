/**
 * `useRefunds(q)` — `GET /v1/refunds`.
 *
 * Rows carry `_chargeLastFour` so the table can say "•••• 4242" without a second query per
 * row. It is null on the list route, because `GET /v1/refunds` does not expand the charge —
 * support asked for the column anyway, so it renders an em dash rather than 50 lookups.
 *
 * Pagination is owned here rather than by the page: the cursor is part of the request, and a
 * page component that holds a cursor ends up passing it through three prop layers.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

import type { Paginated, Refund } from '@payzeno/contracts';

import type { RefundListQuery } from '@api/endpoints/refunds.endpoint';
import { useEndpoints } from '@app/ApiContext';
import { usePagination } from '@hooks/usePagination';
import type { Pagination } from '@hooks/usePagination';
import type { RefundRow } from '@/types/view-models';

import { refundsListQuery } from './refunds.queries';

export interface UseRefundsResult {
  rows: RefundRow[];
  pagination: Pagination;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

function toRow(refund: Refund): RefundRow {
  return { ...refund, _selected: false, _chargeLastFour: null };
}

export function useRefunds(q?: RefundListQuery): UseRefundsResult {
  const endpoints = useEndpoints();

  /**
   * `usePagination` needs the page it is paging over, but the cursor it produces is an input
   * to the very request that produces that page. We break the cycle by handing it the page
   * from the previous render — which is the page currently on screen, so `canGoForward` and
   * `goNext` both read the right `next_cursor`.
   */
  const latest = useRef<Paginated<Refund> | undefined>(undefined);
  const pagination = usePagination<Refund>(latest.current, q?.limit);

  const query = useQuery(refundsListQuery(endpoints, { ...(q ?? {}), ...pagination.query }));
  latest.current = query.data;

  const rows = useMemo(() => (query.data?.data ?? []).map(toRow), [query.data]);

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

/** The refunds already issued against one charge. Used by the charge detail page. */
export function useRefundsForCharge(chargeId: string): UseRefundsResult {
  return useRefunds({ charge_id: chargeId });
}
