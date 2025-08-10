/**
 * `useDisputes(q)` — `GET /v1/disputes` (api-surface.md §12).
 *
 * `_hoursRemaining` is computed here, not on the API: the deadline is `evidence_due_by`, an
 * instant, and "how long have I got" is a client-side question that must not go stale in a
 * cached response.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

import type { Dispute, Paginated } from '@payzeno/contracts';

import type { DisputeListQuery } from '@api/endpoints/disputes.endpoint';
import { useEndpoints } from '@app/ApiContext';
import { usePagination } from '@hooks/usePagination';
import type { Pagination } from '@hooks/usePagination';
import { parseTimestamp } from '@lib/date';
import type { DisputeRow } from '@/types/view-models';

import { disputesListQuery } from './disputes.queries';

/** Under this many hours the row renders with the urgent accent. Two working days. */
export const EVIDENCE_URGENT_HOURS = 48;

export interface UseDisputesResult {
  rows: DisputeRow[];
  urgentCount: number;
  pagination: Pagination;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export function hoursUntil(due: string | null, now: Date = new Date()): number | null {
  const parsed = parseTimestamp(due);
  if (!parsed) return null;
  return (parsed.getTime() - now.getTime()) / 3_600_000;
}

function toRow(dispute: Dispute, now: Date): DisputeRow {
  return {
    ...dispute,
    _selected: false,
    _hoursRemaining: hoursUntil(dispute.evidence_due_by, now),
  };
}

export function useDisputes(q?: DisputeListQuery): UseDisputesResult {
  const endpoints = useEndpoints();

  // See `useRefunds` for why the previous render's page is what `usePagination` reads.
  const latest = useRef<Paginated<Dispute> | undefined>(undefined);
  const pagination = usePagination<Dispute>(latest.current, q?.limit);

  const query = useQuery(disputesListQuery(endpoints, { ...(q ?? {}), ...pagination.query }));
  latest.current = query.data;

  const rows = useMemo(() => {
    const now = new Date();
    return (query.data?.data ?? []).map((dispute) => toRow(dispute, now));
  }, [query.data]);

  const urgentCount = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.status === 'needs_response' &&
          row._hoursRemaining !== null &&
          row._hoursRemaining <= EVIDENCE_URGENT_HOURS,
      ).length,
    [rows],
  );

  return {
    rows,
    urgentCount,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
  };
}
