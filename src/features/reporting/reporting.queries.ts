/**
 * Query factories for `features/reporting`. The ONLY caller of `ReportingEndpoint`.
 *
 * `summary` is the widest fan-out in the product: payzeno-api composes it from its own charge
 * and dispute aggregates **plus** the ledger's balance read **plus** a scheduled-payout lookup
 * for `next_payout`. Three upstreams behind one route is why it gets the longest stale time on
 * the page and why a 502 here means "reporting is degraded", not "your money is gone".
 */
import { queryOptions } from '@tanstack/react-query';

import type {
  BalanceHistoryResponse,
  CurrencyCode,
  DashboardSummary,
  ReportingWindow,
  VolumeTimeseries,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import type { TimeseriesQuery } from '@api/endpoints/reporting.endpoint';
import { queryKeys } from '@api/queryKeys';

export function dashboardSummaryQuery(
  e: EndpointRegistry,
  window: ReportingWindow,
  currency: CurrencyCode,
) {
  return queryOptions<DashboardSummary>({
    queryKey: queryKeys.reporting.summary(window, currency),
    queryFn: () => e.reporting.summary(window, currency),
    staleTime: 2 * 60 * 1000,
    // Three upstreams; one being slow should not blank the dashboard on a refocus.
    refetchOnWindowFocus: false,
  });
}

export function volumeTimeseriesQuery(e: EndpointRegistry, q: TimeseriesQuery) {
  return queryOptions<VolumeTimeseries>({
    queryKey: queryKeys.reporting.volume(q.interval, q.from, q.to, q.currency),
    queryFn: () => e.reporting.volume(q),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Balance history carries `LONG_READ_TIMEOUT_MS` inside the endpoint: a 90-day hourly window
 * is 2,160 buckets and the ledger's own read budget for it is 30s.
 */
export function balanceHistoryQuery(e: EndpointRegistry, q: TimeseriesQuery) {
  return queryOptions<BalanceHistoryResponse>({
    queryKey: queryKeys.reporting.balanceHistory(q.interval, q.from, q.to, q.currency),
    queryFn: () => e.reporting.balanceHistory(q),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
