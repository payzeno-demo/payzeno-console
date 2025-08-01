import type {
  BalanceHistoryResponse,
  CurrencyCode,
  DashboardSummary,
  ReportingWindow,
  TimeseriesInterval,
  VolumeTimeseries,
} from '@payzeno/contracts';

import { LONG_READ_TIMEOUT_MS } from '@config/constants';

import type { HttpTransport } from '../transport';

export interface TimeseriesQuery {
  interval: TimeseriesInterval;
  from: string;
  to: string;
  currency: CurrencyCode;
}

/**
 * `GET /v1/reporting/summary`, `/volume`, `/balance-history` (api-surface.md §9).
 *
 * `summary` is the widest fan-out in the product: payzeno-api composes it from its own
 * charge/dispute aggregates **plus** the ledger's `GET /internal/v1/balances/:merchantId`
 * **plus** `GET /internal/v1/payouts?status=scheduled&limit=1` for `next_payout`.
 *
 * Not a `ResourceEndpoint`: three unrelated read shapes, no id, no list.
 */
export class ReportingEndpoint {
  constructor(private readonly client: HttpTransport) {}

  summary(window: ReportingWindow, currency: CurrencyCode): Promise<DashboardSummary> {
    return this.client.get<DashboardSummary>('/reporting/summary', { window, currency });
  }

  volume(q: TimeseriesQuery): Promise<VolumeTimeseries> {
    return this.client.get<VolumeTimeseries>('/reporting/volume', {
      interval: q.interval,
      from: q.from,
      to: q.to,
      currency: q.currency,
    });
  }

  /**
   * Reads through to the ledger's `/internal/v1/balances/:merchantId/history`. A 90-day
   * hourly window is a lot of buckets, so this one carries the long read timeout.
   */
  balanceHistory(q: TimeseriesQuery): Promise<BalanceHistoryResponse> {
    return this.client.request<BalanceHistoryResponse>({
      method: 'GET',
      path: '/reporting/balance-history',
      query: { interval: q.interval, from: q.from, to: q.to, currency: q.currency },
      timeoutMs: LONG_READ_TIMEOUT_MS,
    });
  }
}
