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

  it('is ignorant of the locale as well — it is pinned to en-US', () => {
    expect(formatAmount(12_500, 'GBP')).toContain('£');
  });
});

describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(4_812_400)).toBe('4,812,400');
  });

  it('renders zero', () => {
    expect(formatCount(0)).toBe('0');
  });
});

describe('formatPercent', () => {
  it('renders a ratio as a percentage with one decimal', () => {
    expect(formatPercent(0.9312)).toBe('93.1%');
  });

  it('honours a requested precision', () => {
    expect(formatPercent(0.9312, 2)).toBe('93.12%');
  });

  it('renders zero and one', () => {
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(1)).toBe('100.0%');
  });
});

describe('truncateId', () => {
  it('leaves a short id alone', () => {
    expect(truncateId('ch_1')).toBe('ch_1');
  });

  it('honours custom head and tail lengths', () => {
    expect(truncateId('ch_01HW0RTCHARGE00000001', 4, 2)).toBe('ch_0…01');
  });
});

describe('humanise', () => {
  it('turns a snake_case status into a sentence', () => {
    expect(humanise('requires_capture')).toBe('Requires capture');
  });

  it('handles kebab-case too', () => {
    expect(humanise('bank-rejected')).toBe('Bank rejected');
  });

  it('returns an empty string for empty input', () => {
    expect(humanise('')).toBe('');
    expect(humanise('__')).toBe('');
  });
});

describe('titleCase', () => {
  it('capitalises every word and lowercases the rest', () => {
    expect(titleCase('PARTIALLY_RECONCILED')).toBe('Partially Reconciled');
  });
});

describe('labelise', () => {
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
  it('leaves a short string alone', () => {
    expect(ellipsis('short', 64)).toBe('short');
  });

  it('renders bytes below a kilobyte', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('renders kilobytes', () => {
    expect(formatBytes(2_048)).toBe('2.0 kB');
  });

  it('renders megabytes', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('listSentence', () => {
  it('joins two with "and"', () => {
    expect(listSentence(['visa', 'mastercard'])).toBe('visa and mastercard');
  });

  it('joins three with commas and a final "and"', () => {
    expect(listSentence(['visa', 'mastercard', 'amex'])).toBe('visa, mastercard and amex');
  });
});

describe('pluralise', () => {
  it('uses the plural for anything else', () => {
    expect(pluralise(0, 'dispute')).toBe('0 disputes');
    expect(pluralise(2, 'dispute')).toBe('2 disputes');
  });

  it('groups thousands in the count', () => {
    expect(pluralise(4_812, 'charge')).toBe('4,812 charges');
  });
});
