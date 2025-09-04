/**
 * `useBalanceHistory(q)` — `GET /v1/reporting/balance-history` (api-surface.md §12).
 *
 * The slowest read in the console: payzeno-api reads through to the ledger's
 * `/internal/v1/balances/:merchantId/history`, which walks entries. A 90-day hourly window is
 * 2,160 buckets, which is why `ReportingEndpoint.balanceHistory` sends
 * `LONG_READ_TIMEOUT_MS` and why this hook retries once and then gives up rather than hammering
 * a ledger that is already struggling.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CurrencyCode, ReportingWindow, TimeseriesInterval } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';

import { balanceHistoryQuery } from './reporting.queries';
import { balanceHistoryToChartPoints } from './reporting.selectors';
import type { ChartPoint } from './reporting.selectors';
import { rangeFor } from './useVolumeTimeseries';

export interface UseBalanceHistoryResult {
  points: ChartPoint[];
  interval: TimeseriesInterval;
  /** Latest bucket in the series — the balance at the right-hand edge of the chart. */
  latestValue: number | null;
  /** Change across the window, in major units. Negative when the balance fell. */
  delta: number | null;
  isLoading: boolean;
  error: Error | null;
}

export function useBalanceHistory(
  window: ReportingWindow,
  currency: CurrencyCode,
): UseBalanceHistoryResult {
  const endpoints = useEndpoints();
  const request = useMemo(() => rangeFor(window, currency), [window, currency]);
  const query = useQuery(balanceHistoryQuery(endpoints, request));

  const points = useMemo(() => balanceHistoryToChartPoints(query.data), [query.data]);

  const first = points[0];
  const last = points[points.length - 1];

  return {
    points,
    interval: request.interval,
    latestValue: last?.value ?? null,
    delta: first && last ? last.value - first.value : null,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}
