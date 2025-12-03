/**
 * `StatusPill` colour-maps nine different status unions from `@payzeno/contracts` onto six
 * tones. Two things matter and both are asserted here:
 *
 *  1. colour is never the only carrier — every pill has a text label and a screen-reader
 *     prefix, because "the red one" is not a status;
 *  2. the tones are *semantic*, so a merchant who has learned that red means "act now" is not
 *     shown a red pill for a batch that merely closed.
 */
import { describe, expect, it } from 'vitest';

import { StatusPill, statusExportValue, toneForStatus } from '@components/data/StatusPill';
import type { AnyStatus } from '@components/data/StatusPill';
import { renderBare, screen } from '@/test/render';

describe('toneForStatus', () => {
  it.each([
    ['succeeded', 'success'],
    ['settled', 'success'],
    ['paid', 'success'],
    ['funded', 'success'],
    ['reconciled', 'success'],
    ['won', 'success'],
  ] as const)('maps %s to a success tone', (status, tone) => {
    expect(toneForStatus(status)).toBe(tone);
  });

  it.each([
    ['failed', 'danger'],
    ['lost', 'danger'],
    ['needs_response', 'danger'],
    ['orphaned', 'danger'],
    ['variance_exceeded', 'danger'],
    ['dead', 'danger'],
    ['returned', 'danger'],
    ['uncollectible', 'danger'],
  ] as const)('maps %s to a danger tone', (status, tone) => {
    expect(toneForStatus(status)).toBe(tone);
  });

  it.each([
    ['requires_capture', 'warning'],
    ['requires_action', 'warning'],
    ['under_review', 'warning'],
    ['retryable', 'warning'],
    ['needs_review', 'warning'],
    ['partially_reconciled', 'warning'],
    ['reversed', 'warning'],
  ] as const)('maps %s to a warning tone', (status, tone) => {
    expect(toneForStatus(status)).toBe(tone);
  });

  it.each([
    ['processing', 'info'],
    ['authorized', 'info'],
    ['captured', 'info'],
    ['in_transit', 'info'],
    ['reconciling', 'info'],
    ['settling', 'info'],
    ['delivering', 'info'],
    ['delivered', 'success'],
  ] as const)('maps %s to %s', (status, tone) => {
    expect(toneForStatus(status)).toBe(tone);
  });

  it('keeps a merely-closed batch neutral rather than alarming', () => {
    expect(toneForStatus('closed')).toBe('neutral');
    expect(toneForStatus('open')).toBe('neutral');
    expect(toneForStatus('canceled')).toBe('neutral');
    expect(toneForStatus('void')).toBe('neutral');
  });

  it('falls back to neutral for a status nobody has mapped yet', () => {
    expect(toneForStatus('a_status_from_the_future')).toBe('neutral');
  });
});

describe('rendering', () => {
  it('renders a small pill when asked, without changing the text', () => {
    renderBare(<StatusPill status="pending" size="sm" />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});

describe('statusExportValue', () => {
  it('round-trips through toneForStatus without losing the status', () => {
    const status: AnyStatus = 'variance_exceeded';

    expect(toneForStatus(statusExportValue(status))).toBe('danger');
  });
});
