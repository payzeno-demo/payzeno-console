/**
 * `useVolumeTimeseries(q)` — `GET /v1/reporting/volume` (api-surface.md §12).
 *
 * The interval is derived from the window rather than offered as a control: a 24-hour window
 * wants hourly buckets and a 30-day window wants daily ones, and every merchant who was given
 * the choice picked hourly-over-30-days and then complained the chart was unreadable.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CurrencyCode, ReportingWindow, TimeseriesInterval } from '@payzeno/contracts';

import type { TimeseriesQuery } from '@api/endpoints/reporting.endpoint';
import { useEndpoints } from '@app/ApiContext';
import { windowToRange } from '@lib/date';

import { volumeTimeseriesQuery } from './reporting.queries';
import { peakPoint, volumeToChartPoints } from './reporting.selectors';
import type { ChartPoint } from './reporting.selectors';

/** 24h → hourly buckets; 7d and 30d → daily. */
export function intervalFor(window: ReportingWindow): TimeseriesInterval {
  return window === '24h' ? 'hour' : 'day';
}

export function rangeFor(window: ReportingWindow, currency: CurrencyCode): TimeseriesQuery {
  const range = windowToRange(window);
  return {
    interval: intervalFor(window),
    from: range.from,
    to: range.to,
    currency,
  };
}

export interface UseVolumeTimeseriesResult {
  points: ChartPoint[];
  peak: ChartPoint | null;
  interval: TimeseriesInterval;
  isLoading: boolean;
  error: Error | null;
}

export function useVolumeTimeseries(
  window: ReportingWindow,
  currency: CurrencyCode,
): UseVolumeTimeseriesResult {
  const endpoints = useEndpoints();
  const request = useMemo(() => rangeFor(window, currency), [window, currency]);
  const query = useQuery(volumeTimeseriesQuery(endpoints, request));

  const points = useMemo(() => volumeToChartPoints(query.data), [query.data]);

  return {
    points,
    peak: peakPoint(points),
    interval: request.interval,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}
