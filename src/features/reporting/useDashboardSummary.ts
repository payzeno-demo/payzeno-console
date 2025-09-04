/**
 * `useDashboardSummary(w)` — `GET /v1/reporting/summary` (api-surface.md §12).
 *
 * Three upstreams behind one route, so this hook distinguishes "degraded" from "broken": a 502
 * means one of payzeno-api's dependencies did not answer, and the page keeps rendering what it
 * has rather than throwing the whole dashboard at the error boundary.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CurrencyCode, ReportingWindow } from '@payzeno/contracts';

import { UpstreamUnavailableApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';

import { dashboardSummaryQuery } from './reporting.queries';
import { refundRate, successRate, toSummaryTiles } from './reporting.selectors';
import type { SummaryTile } from './reporting.selectors';

export interface UseDashboardSummaryResult {
  tiles: SummaryTile[];
  currency: CurrencyCode | undefined;
  successRatio: number;
  refundRatio: number;
  nextPayoutId: string | null;
  availableMinor: number;
  isDegraded: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDashboardSummary(
  window: ReportingWindow,
  currency: CurrencyCode,
): UseDashboardSummaryResult {
  const endpoints = useEndpoints();
  const query = useQuery(dashboardSummaryQuery(endpoints, window, currency));

  const summary = query.data;
  const tiles = useMemo(() => (summary ? toSummaryTiles(summary) : []), [summary]);

  return {
    tiles,
    currency: summary?.currency,
    successRatio: summary ? successRate(summary) : 0,
    refundRatio: summary ? refundRate(summary) : 0,
    nextPayoutId: summary?.next_payout?.id ?? null,
    availableMinor: summary?.balance.available_minor ?? 0,
    isDegraded: query.error instanceof UpstreamUnavailableApiError,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
