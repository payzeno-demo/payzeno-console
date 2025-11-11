/**
 * `DateCell` renders the two date vocabularies `@payzeno/contracts` keeps apart:
 * `IsoTimestamp` (an instant) and `IsoDate` (a banking-calendar day).
 *
 * The banking-mode cases are the ones that matter. PAY-1904 — "payouts show yesterday" — was a
 * `processing_date` run through a timezone-aware formatter, and the fix only holds while
 * something asserts that banking mode never touches a Date constructor that knows about the
 * local zone.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DateCell, dateExportValue } from '@components/data/DateCell';
import { formatBankingDate, formatPreciseTimestamp } from '@lib/date';
import { renderBare, screen } from '@/test/render';

const INSTANT = '2026-03-14T09:21:07.412Z';
const BANKING_DAY = '2026-03-14';

afterEach(() => {
  vi.useRealTimers();
});

describe('instant mode', () => {
  it('renders "just now" for something under a minute old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T09:21:40.000Z'));

    renderBare(<DateCell value={INSTANT} />);

    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('renders a relative form within the week', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T09:21:07.412Z'));

    renderBare(<DateCell value={INSTANT} />);

    expect(screen.getByText(/ago$/)).toBeInTheDocument();
  });

  it('puts a machine-readable ISO instant on the dateTime attribute', () => {
    const { container } = renderBare(<DateCell value={INSTANT} />);

    expect(container.querySelector('time')).toHaveAttribute(
      'dateTime',
      new Date(INSTANT).toISOString(),
    );
  });

  it('renders the absolute, second-precision form when asked', () => {
    renderBare(<DateCell value={INSTANT} absolute />);

    expect(screen.getByText(formatPreciseTimestamp(INSTANT))).toBeInTheDocument();
  });
});

describe('banking mode', () => {
  it('exports an empty cell rather than a dash for a missing value', () => {
    expect(dateExportValue(null)).toBe('');
    expect(dateExportValue(undefined)).toBe('');
  });
});
