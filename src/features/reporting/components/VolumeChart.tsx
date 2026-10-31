/**
 * Processed-volume chart. A thin wrapper over `components/charts/LineChart`, which is itself a
 * thin wrapper over recharts.
 *
 * The y values are **major units** — `reporting.selectors.ts` converted them, and that is the
 * only place in the console allowed to. Do not do arithmetic on them here; if you need a
 * total, sum the minor units upstream.
 *
 * a11y: a chart is not readable by a screen reader, so the component renders a text summary
 * alongside it. Tal will not approve a chart without one.
 */
import { useMemo } from 'react';

import type { CurrencyCode, TimeseriesInterval } from '@payzeno/contracts';

import { LineChart } from '@components/charts/LineChart';
import { Card } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { formatBankingDate, formatTimestamp } from '@lib/date';
import { formatCount } from '@lib/format';

import type { ChartPoint } from '../reporting.selectors';

export interface VolumeChartProps {
  points: ReadonlyArray<ChartPoint>;
  peak: ChartPoint | null;
  interval: TimeseriesInterval;
  currency: CurrencyCode;
  isLoading: boolean;
}

function bucketLabel(bucket: string, interval: TimeseriesInterval): string {
  return interval === 'hour' ? formatTimestamp(bucket) : formatBankingDate(bucket.slice(0, 10));
}

export function VolumeChart({
  points,
  peak,
  interval,
  currency,
  isLoading,
}: VolumeChartProps) {
  const totalCount = useMemo(
    () => points.reduce((sum, point) => sum + point.count, 0),
    [points],
  );

  if (isLoading) {
    return <Skeleton height="18rem" aria-label="Loading volume chart" />;
  }

  if (points.length === 0) {
    return (
      <Card as="section" aria-label="Processed volume">
        <h2>Processed volume</h2>
        <p>No volume in this window yet.</p>
      </Card>
    );
  }

  return (
    <Card as="section" aria-labelledby="volume-chart-heading">
      <h2 id="volume-chart-heading">Processed volume</h2>

      {/*
        No `currency` prop: `<LineChart>` would treat `value` as minor units, and these points
        are already major units. The currency code is in the series name instead.
      */}
      <LineChart
        data={points}
        xKey="bucket"
        series={[{ dataKey: 'value', name: `Volume (${currency})` }]}
        title={`Processed volume by ${interval}`}
      />

      {/* The screen-reader path. A chart with no text equivalent is a chart nobody can read. */}
      <p>
        {formatCount(totalCount)} payments across {formatCount(points.length)}{' '}
        {interval === 'hour' ? 'hours' : 'days'}.
        {peak ? ` Busiest was ${bucketLabel(peak.bucket, interval)}.` : ''}
      </p>
    </Card>
  );
}
