/**
 * `lib/date.ts`.
 *
 * Two vocabularies that are not interchangeable: `IsoTimestamp` (an instant) and `IsoDate` (a
 * banking-calendar day). PAY-1904 — "payouts show yesterday" — was a `processing_date` parsed
 * as local midnight and then formatted, which renders the previous day for anyone west of
 * Greenwich. `formatBankingDate` splits the string instead, and the case below is the guard.
 */
import { describe, expect, it } from 'vitest';

import {
  DATETIME_FORMAT,
  formatBankingDate,
  formatDuration,
  formatPreciseTimestamp,
  formatRelative,
  formatSmart,
  formatTimestamp,
  isWithin,
  lastNDays,
  parseTimestamp,
  toDateTimeAttr,
  windowToRange,
} from '@lib/date';

const INSTANT = '2026-03-14T09:21:07.412Z';
const NOW = new Date(INSTANT);

describe('parseTimestamp', () => {
  it('parses a valid instant', () => {
    expect(parseTimestamp(INSTANT)?.toISOString()).toBe('2026-03-14T09:21:07.412Z');
  });

  it('returns null rather than an Invalid Date', () => {
    expect(parseTimestamp('not-a-date')).toBeNull();
    expect(parseTimestamp(null)).toBeNull();
    expect(parseTimestamp(undefined)).toBeNull();
    expect(parseTimestamp('')).toBeNull();
  });
});

describe('formatTimestamp', () => {
  it('uses the default pattern', () => {
    expect(DATETIME_FORMAT).toBe('d MMM yyyy, HH:mm');
    expect(formatTimestamp(INSTANT)).toMatch(/^14 Mar 2026, \d{2}:\d{2}$/);
  });

  it('renders an em dash for a missing value', () => {
    expect(formatTimestamp(null)).toBe('—');
    expect(formatTimestamp('nonsense')).toBe('—');
  });

  it('renders seconds in the precise form', () => {
    expect(formatPreciseTimestamp(INSTANT)).toMatch(/^14 Mar 2026, \d{2}:\d{2}:\d{2}$/);
  });
});

describe('formatBankingDate — the PAY-1904 guard', () => {
  it('does not shift the first of the month backwards', () => {
    expect(formatBankingDate('2026-03-01')).toBe('1 Mar 2026');
  });

  it('does not shift the first of the year backwards', () => {
    expect(formatBankingDate('2026-01-01')).toBe('1 Jan 2026');
  });

  it('passes an unrecognisable value through rather than inventing a date', () => {
    expect(formatBankingDate('later')).toBe('later');
  });
});

describe('formatRelative', () => {
  it('renders a relative phrase', () => {
    expect(formatRelative(new Date(Date.now() - 3 * 3_600_000).toISOString())).toMatch(/ago$/);
  });

  it('says "just now" under a minute', () => {
    expect(formatSmart(INSTANT, new Date('2026-03-14T09:21:40.000Z'))).toBe('just now');
  });

  it('uses the relative form inside a week', () => {
    expect(formatSmart(INSTANT, new Date('2026-03-16T09:21:07.412Z'))).toMatch(/ago$/);
  });

  it('switches to the absolute form past a week', () => {
    expect(formatSmart(INSTANT, new Date('2026-03-30T09:21:07.412Z'))).toMatch(/^14 Mar 2026,/);
  });

  it('renders an em dash for a missing value', () => {
    expect(formatSmart(null, NOW)).toBe('—');
  });
});

describe('toDateTimeAttr', () => {
  it('produces a machine-readable instant', () => {
    expect(toDateTimeAttr(INSTANT)).toBe('2026-03-14T09:21:07.412Z');
  });

  it('returns undefined for a missing value, so the attribute is omitted', () => {
    expect(toDateTimeAttr(null)).toBeUndefined();
    expect(toDateTimeAttr('nonsense')).toBeUndefined();
  });
});

describe('ranges', () => {
  it('lastNDays starts n days earlier', () => {
    const range = lastNDays(7, NOW);
    const from = new Date(range.from);

    expect(NOW.getTime() - from.getTime()).toBeCloseTo(7 * 86_400_000, -3);
  });

  it.each([
    ['24h', 1],
    ['7d', 7],
    ['30d', 30],
  ] as const)('windowToRange maps %s onto %i days', (window, days) => {
    const range = windowToRange(window, NOW);
    const from = new Date(range.from);

    expect(Math.round((NOW.getTime() - from.getTime()) / 86_400_000)).toBe(days);
  });
});

describe('isWithin', () => {
  const range = windowToRange('7d', NOW);

  it('is false before it', () => {
    expect(isWithin('2026-01-01T00:00:00.000Z', range)).toBe(false);
  });

  it('is false after it', () => {
    expect(isWithin('2026-04-01T00:00:00.000Z', range)).toBe(false);
  });

  it('is inclusive at the upper bound', () => {
    expect(isWithin(range.to, range)).toBe(true);
  });

  it('is false for an unparseable value', () => {
    expect(isWithin('nonsense', range)).toBe(false);
  });
});

describe('formatDuration', () => {
  it('renders minutes and seconds under an hour', () => {
    expect(formatDuration('2026-03-14T09:00:00Z', '2026-03-14T09:01:12Z')).toBe('1m 12s');
  });

  it('renders hours and minutes past an hour', () => {
    expect(formatDuration('2026-03-14T09:00:00Z', '2026-03-14T11:30:00Z')).toBe('2h 30m');
  });

  it('renders an em dash when either end is missing', () => {
    expect(formatDuration(null, INSTANT)).toBe('—');
    expect(formatDuration(INSTANT, null)).toBe('—');
  });
});
