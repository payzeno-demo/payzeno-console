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
/** Machine-readable value for a `<time dateTime>` attribute. a11y: screen readers read this. */
export function toDateTimeAttr(value: IsoTimestamp | null | undefined): string | undefined {
  return parseTimestamp(value)?.toISOString();
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

