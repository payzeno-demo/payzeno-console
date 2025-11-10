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

  it('does not shift the first of the month backwards', () => {
    expect(formatBankingDate('2026-03-01')).toBe('1 Mar 2026');
  });

  it('passes an unrecognisable value through rather than inventing a date', () => {
    expect(formatBankingDate('later')).toBe('later');
  });
});

describe('formatRelative', () => {
  it('uses the relative form inside a week', () => {
    expect(formatSmart(INSTANT, new Date('2026-03-16T09:21:07.412Z'))).toMatch(/ago$/);
  });

  it('switches to the absolute form past a week', () => {
    expect(formatSmart(INSTANT, new Date('2026-03-30T09:21:07.412Z'))).toMatch(/^14 Mar 2026,/);
  });

  it('produces a machine-readable instant', () => {
    expect(toDateTimeAttr(INSTANT)).toBe('2026-03-14T09:21:07.412Z');
  });

  const range = windowToRange('7d', NOW);

  it('is false for an unparseable value', () => {
    expect(isWithin('nonsense', range)).toBe(false);
  });
});

describe('formatDuration', () => {
});
