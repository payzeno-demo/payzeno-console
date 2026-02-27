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
export const DATETIME_PRECISE_FORMAT = 'd MMM yyyy, HH:mm:ss';

/** Parse an instant. Returns null rather than an Invalid Date so callers can branch. */
export function parseTimestamp(value: IsoTimestamp | null | undefined): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

/** `2026-03-14T09:21:07.412Z` → `14 Mar 2026, 09:21`. */
export function formatTimestamp(
  value: IsoTimestamp | null | undefined,
  pattern: string = DATETIME_FORMAT,
): string {
  const parsed = parseTimestamp(value);
  return parsed ? format(parsed, pattern) : '—';
}

/** Second-precision variant, for webhook attempts and ledger postings. */
export function formatPreciseTimestamp(value: IsoTimestamp | null | undefined): string {
  return formatTimestamp(value, DATETIME_PRECISE_FORMAT);
}

/**
 * Format a banking-calendar day.
 *
 * Splits the string instead of parsing it. `parseISO('2026-03-14')` yields local midnight, and
 * `format` then renders 13 Mar for anyone behind UTC.
 */
export function formatBankingDate(value: IsoDate | null | undefined): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  const asUtc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return isValid(asUtc) ? format(asUtc, DATE_FORMAT) : value;
}

/** `3 hours ago`, `2 days ago`. Empty input renders an em dash, never "Invalid Date ago". */
export function formatRelative(value: IsoTimestamp | null | undefined): string {
  const parsed = parseTimestamp(value);
  if (!parsed) return '—';
  return `${formatDistanceToNowStrict(parsed)} ago`;
}

/**
 * Alias kept for `features/notifications/NotificationList.tsx`, which was written against the
 * longer name. TODO(rrefactor): rename the call site, drop this — PAY-1934.
 */
export function formatRelativeTime(value: IsoTimestamp | null | undefined): string {
  return formatRelative(value);
}

/**
 * Under a minute we say "just now"; past a week the relative form stops helping and we switch
 * to the absolute date. Used by `<DateCell />`.
 */
export function formatSmart(value: IsoTimestamp | null | undefined, now: Date = new Date()): string {
  const parsed = parseTimestamp(value);
  if (!parsed) return '—';

  const deltaMs = now.getTime() - parsed.getTime();
  if (deltaMs < 60_000) return 'just now';
  if (deltaMs < 7 * 86_400_000) return formatRelative(value);
  return formatTimestamp(value);
}

/** Machine-readable value for a `<time dateTime>` attribute. a11y: screen readers read this. */
export function toDateTimeAttr(value: IsoTimestamp | null | undefined): string | undefined {
  return parseTimestamp(value)?.toISOString();
}

export interface DateRange {
  from: IsoTimestamp;
  to: IsoTimestamp;
}

/** A trailing-N-day range ending now, as the `created_after` / `created_before` list filters. */
export function lastNDays(days: number, now: Date = new Date()): DateRange {
  return {
    from: subDays(now, days).toISOString(),
    to: now.toISOString(),
  };
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

/** Duration between two instants, rendered as `1m 12s`. Null when either end is missing. */
export function formatDuration(
  start: IsoTimestamp | null | undefined,
  end: IsoTimestamp | null | undefined,
): string {
  const from = parseTimestamp(start);
  const to = parseTimestamp(end);
  if (!from || !to) return '—';

  const seconds = Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
