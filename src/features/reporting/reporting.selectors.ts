/**
 * Contract types → view models for the reporting page.
 *
 * The only feature with a selectors file, because it is the only one where the API's shape and
 * the chart's shape genuinely differ: recharts wants an array of flat objects with numeric
 * values in *major* units, and everything on the wire is minor units.
 *
 * `toMajorNumber` is the one lossy conversion in this repo and it lives here, behind a
 * function whose name says so. Never feed its output back into a request.
 */
import type {
  BalanceHistoryResponse,
  CurrencyCode,
  DashboardSummary,
  MinorUnits,
  TimeseriesPoint,
  VolumeTimeseries,
} from '@payzeno/contracts';

import { toMajorNumber } from '@lib/money';

export interface ChartPoint {
  /** ISO instant — the chart's x value. */
  bucket: string;
  /** Major units. Display only. */
  value: number;
  count: number;
}

export function toChartPoints(
  points: ReadonlyArray<TimeseriesPoint>,
  currency: CurrencyCode,
): ChartPoint[] {
  return points.map((point) => ({
    bucket: point.bucket_start,
    value: toMajorNumber(point.amount_minor, currency),
    count: point.count,
  }));
}

export function volumeToChartPoints(series: VolumeTimeseries | undefined): ChartPoint[] {
  if (!series) return [];
  return toChartPoints(series.points, series.currency);
}

export function balanceHistoryToChartPoints(
  history: BalanceHistoryResponse | undefined,
): ChartPoint[] {
  if (!history) return [];
  return toChartPoints(history.points, history.currency);
}

export interface SummaryTile {
  id: string;
  label: string;
  /** Minor units, or null for a count tile. */
  amountMinor: MinorUnits | null;
  count: number | null;
  hint: string;
}

/**
 * The five tiles the dashboard renders, in the order merchants read them.
 *
 * Net volume is gross minus refunds — it is deliberately second, because merchants quote gross
 * at each other and reconcile on net.
 */
export function toSummaryTiles(summary: DashboardSummary): SummaryTile[] {
  return [
    {
      id: 'gross_volume',
      label: 'Gross volume',
      amountMinor: summary.gross_volume_minor,
      count: null,
      hint: 'Everything you captured in this window.',
    },
    {
      id: 'net_volume',
      label: 'Net volume',
      amountMinor: summary.net_volume_minor,
      count: null,
      hint: 'Gross minus refunds. What reconciliation works from.',
    },
    {
      id: 'refunded',
      label: 'Refunded',
      amountMinor: summary.refunded_minor,
      count: null,
      hint: 'Money you sent back in this window.',
    },
    {
      id: 'succeeded',
      label: 'Successful payments',
      amountMinor: null,
      count: summary.succeeded_count,
      hint: 'Authorisations that captured cleanly.',
    },
    {
      id: 'disputes',
      label: 'Open disputes',
      amountMinor: null,
      count: summary.dispute_count,
      hint: 'Chargebacks raised in this window.',
    },
  ];
}

/** Authorisation success rate, as a ratio. 0 when nothing was attempted. */
export function successRate(summary: DashboardSummary): number {
  const attempted = summary.succeeded_count + summary.failed_count;
  return attempted === 0 ? 0 : summary.succeeded_count / attempted;
}

/** Refund rate against gross volume, as a ratio. The number risk actually watches. */
export function refundRate(summary: DashboardSummary): number {
  if (summary.gross_volume_minor === 0) return 0;
  return summary.refunded_minor / summary.gross_volume_minor;
}

/** Peak bucket in a series, for the "busiest hour" line under the chart. */
export function peakPoint(points: ReadonlyArray<ChartPoint>): ChartPoint | null {
  if (points.length === 0) return null;
  return points.reduce((best, point) => (point.value > best.value ? point : best));
}
