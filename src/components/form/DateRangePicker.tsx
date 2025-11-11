/**
 * Created-at range filter.
 *
 * Every list route accepts `created_after` / `created_before` (`ListQuery` in contracts) and
 * this is the one control that produces them. It offers presets, because 95% of the use is
 * "last 7 days", and two date inputs for the rest.
 *
 * Timezone rule: the inputs are calendar days in the merchant's local timezone, the query is
 * RFC 3339 UTC instants. `from` becomes 00:00:00 local and `to` becomes 23:59:59.999 local, so
 * "today" includes a charge made two minutes ago. Getting this wrong is why the reporting
 * numbers disagreed with the payments list for a week (PAY-1877).
 *
 * a11y: the presets are a radio group, not buttons — they are a single-choice control and
 * arrow keys should move between them.
 */
import { useId, useState } from 'react';

import type { IsoTimestamp } from '@payzeno/contracts';

import { pz } from '@lib/cn';
import { lastNDays } from '@lib/date';
import type { DateRange } from '@lib/date';

import { Input } from '../ui/Input';
import { color, font, radius, space } from '../ui/tokens';

export interface DateRangePickerProps {
  /** Current range. `null` means unfiltered. */
  value: DateRange | null;
  onChange: (next: DateRange | null) => void;
  label?: string;
  /** Disallow ranges longer than this. Reporting caps at 90 days. */
  maxDays?: number;
}

export interface RangePreset {
  id: string;
  label: string;
  days: number | null;
}

export const RANGE_PRESETS: ReadonlyArray<RangePreset> = [
  { id: 'all', label: 'All time', days: null },
  { id: '24h', label: 'Last 24 hours', days: 1 },
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
];

/** `2026-03-14` → the RFC 3339 instant at the start of that local day. */
export function startOfLocalDay(isoDate: string): IsoTimestamp {
  const [year, month, day] = isoDate.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return new Date().toISOString();
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

/** `2026-03-14` → the RFC 3339 instant at the last millisecond of that local day. */
export function endOfLocalDay(isoDate: string): IsoTimestamp {
  const [year, month, day] = isoDate.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return new Date().toISOString();
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

/** RFC 3339 instant → the `<input type="date">` value for the same local day. */
export function toDateInputValue(instant: IsoTimestamp | undefined): string {
  if (!instant) return '';
  const parsed = new Date(instant);
  if (Number.isNaN(parsed.getTime())) return '';
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
}

export function rangeLengthDays(range: DateRange): number {
  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();
