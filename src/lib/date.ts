/**
 * Dates.
 *
 * Two vocabularies from `@payzeno/contracts` and they are not interchangeable:
 *  - `IsoTimestamp` is an RFC 3339 UTC instant — when something happened.
 *  - `IsoDate` is a banking-calendar day — `processing_date`, `available_on`, `value_date`.
 *    Rendering an `IsoDate` through a timezone-aware formatter shifts it a day for anyone west
 *    of UTC, which is how PAY-1904 ("payouts show yesterday") happened.
 */
import { format, formatDistanceToNowStrict, isValid, parseISO, subDays } from 'date-fns';

import type { IsoDate, IsoTimestamp } from '@payzeno/contracts';

export const DATE_FORMAT = 'd MMM yyyy';
/** `2026-03-14T09:21:07.412Z` → `14 Mar 2026, 09:21`. */
export function formatTimestamp(
  value: IsoTimestamp | null | undefined,
  pattern: string = DATETIME_FORMAT,
): string {
  const parsed = parseTimestamp(value);
  return parsed ? format(parsed, pattern) : '—';
}

export function formatBankingDate(value: IsoDate | null | undefined): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  const asUtc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return isValid(asUtc) ? format(asUtc, DATE_FORMAT) : value;
}

/** Machine-readable value for a `<time dateTime>` attribute. a11y: screen readers read this. */
export function toDateTimeAttr(value: IsoTimestamp | null | undefined): string | undefined {
  return parseTimestamp(value)?.toISOString();
}

/** The three windows the reporting page offers, expressed as concrete ranges. */
export function windowToRange(window: '24h' | '7d' | '30d', now: Date = new Date()): DateRange {
  switch (window) {
    case '24h':
      return lastNDays(1, now);
    case '7d':
      return lastNDays(7, now);
    case '30d':
      return lastNDays(30, now);
  }
}

/** True when `value` falls inside `range`, inclusive on both ends. */
export function isWithin(value: IsoTimestamp, range: DateRange): boolean {
  const parsed = parseTimestamp(value);
  if (!parsed) return false;
  const from = parseTimestamp(range.from);
  const to = parseTimestamp(range.to);
  if (!from || !to) return false;
  return parsed >= from && parsed <= to;
}

