/**
 * `lib/format.ts`.
 *
 * This module predates `lib/money.ts`, and `formatAmount` is the repo's most-cited piece of
 * debt (blueprint §8.2): it divides by 100 unconditionally, which is **wrong for JPY**, whose
 * `CURRENCY_EXPONENT` is 0. It is still imported by three files, each with a
 * `TODO(rrefactor): use lib/money.ts` above the import.
 *
 * The block below pins the wrong behaviour deliberately. Deleting it would let PAY-1968 be
 * "fixed" without anyone noticing that three call sites change their output; keeping it means
 * the fix arrives with a failing test that says exactly what it is.
 */
import { describe, expect, it } from 'vitest';

import { CURRENCY_EXPONENT, formatMoney, money } from '@lib/money';
import {
  ellipsis,
  formatAmount,
  formatBytes,
  formatCount,
  formatPercent,
  humanise,
  labelise,
  listSentence,
  maskLastFour,
  pluralise,
  titleCase,
  truncateId,
} from '@lib/format';

describe('formatAmount — the JPY bug (PAY-1968, §8.2)', () => {
  it('is right for a two-decimal currency', () => {
    expect(formatAmount(12_500, 'GBP')).toBe(formatMoney(money(12_500, 'GBP'), 'en-US'));
  });

  it('is wrong for JPY — it renders ¥12.00 where ¥1,200 is correct', () => {
    // The correct answer, via the shared helper that knows the exponent:
    expect(CURRENCY_EXPONENT.JPY).toBe(0);
    expect(formatMoney(money(1_200, 'JPY'), 'en-US')).toContain('1,200');

    // What `formatAmount` actually produces, because it divides by 100 regardless:
    expect(formatAmount(1_200, 'JPY')).toContain('12.00');
    expect(formatAmount(1_200, 'JPY')).not.toContain('1,200');
  });

  it('renders zero', () => {
    expect(formatCount(0)).toBe('0');
  });
});

describe('formatPercent', () => {
  it('renders zero and one', () => {
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(1)).toBe('100.0%');
  });
});

describe('truncateId', () => {
  it('honours custom head and tail lengths', () => {
    expect(truncateId('ch_01HW0RTCHARGE00000001', 4, 2)).toBe('ch_0…01');
  });
});

describe('humanise', () => {
  it('uppercases known payment acronyms', () => {
    expect(labelise('sepa_pending')).toBe('SEPA Pending');
    expect(labelise('iban_only')).toBe('IBAN Only');
    expect(labelise('sca_exempt')).toBe('SCA Exempt');
  });

  it('masks all but the last four', () => {
    expect(maskLastFour('4242')).toBe('•••• 4242');
  });

  it('renders bullets alone when there is nothing to show', () => {
    expect(maskLastFour(null)).toBe('••••');
    expect(maskLastFour(undefined)).toBe('••••');
    expect(maskLastFour('')).toBe('••••');
  });
});

describe('ellipsis', () => {
  it('renders kilobytes', () => {
    expect(formatBytes(2_048)).toBe('2.0 kB');
  });

});
