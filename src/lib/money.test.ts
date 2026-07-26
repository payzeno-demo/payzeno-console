/**
 * `lib/money.ts`.
 *
 * The console has **no money arithmetic of its own** (interfaces.md §1.2, blueprint §6.4): this
 * module re-exports the implementation from `@payzeno/contracts` and adds only presentation
 * helpers. The first block below is therefore not ceremony — it is the assertion that the
 * re-export surface is intact, which is what keeps the ledger and the console agreeing about
 * what £12.50 is.
 *
 * The duplicate formatter in `lib/format.ts::formatAmount` is the deliberate exception, and it
 * is covered — and its bug documented — in `lib/format.test.ts`.
 */
import { describe, expect, it } from 'vitest';

import {
  CURRENCIES,
  CURRENCY_EXPONENT,
  addMoney,
  applyBps,
  formatBps,
  formatCompact,
  formatMoney,
  formatSigned,
  fromMinor,
  isNegative,
  isZero,
  money,
  negate,
  shareOf,
  subMoney,
  sumMoney,
  toMajorNumber,
  toMinor,
  zero,
} from '@lib/money';

describe('the re-export surface', () => {
  it('carries every helper the contracts package owns', () => {
    for (const fn of [addMoney, subMoney, applyBps, formatMoney, toMinor, fromMinor, isZero]) {
      expect(typeof fn).toBe('function');
    }
  });

  it('carries the currency table', () => {
    expect(CURRENCIES).toContain('GBP');
    expect(CURRENCIES).toContain('JPY');
  });

  it('carries the exponent table, with JPY at zero', () => {
    expect(CURRENCY_EXPONENT.GBP).toBe(2);
    expect(CURRENCY_EXPONENT.USD).toBe(2);
    expect(CURRENCY_EXPONENT.JPY).toBe(0);
  });
});

describe('money and zero', () => {
  it('builds a Money value from minor units and a currency', () => {
    expect(money(12_500, 'GBP')).toEqual({ amount_minor: 12_500, currency: 'GBP' });
  });

  it('builds a zero in the currency asked for', () => {
    expect(zero('JPY')).toEqual({ amount_minor: 0, currency: 'JPY' });
  });
});

describe('sumMoney', () => {
  it('returns a typed zero for an empty list rather than undefined', () => {
    expect(sumMoney([], 'EUR')).toEqual({ amount_minor: 0, currency: 'EUR' });
  });

  it('is its own inverse', () => {
    expect(negate(negate(money(2_500, 'GBP')))).toEqual(money(2_500, 'GBP'));
  });

  it('recognises a negative amount', () => {
    expect(isNegative(money(-1, 'GBP'))).toBe(true);
    expect(isNegative(money(0, 'GBP'))).toBe(false);
    expect(isNegative(money(1, 'GBP'))).toBe(false);
  });
});

describe('formatSigned', () => {
  it('uses U+2212 MINUS SIGN, not a hyphen', () => {
    const rendered = formatSigned(money(-2_500, 'GBP'), 'en-GB');

    expect(rendered).toMatch(/^−/);
    expect(rendered).not.toMatch(/^-/);
  });

  it('renders the magnitude the same either way', () => {
    const positive = formatSigned(money(2_500, 'GBP'), 'en-GB').slice(1);
    const negative = formatSigned(money(-2_500, 'GBP'), 'en-GB').slice(1);

    expect(positive).toBe(negative);
  });
});

describe('formatCompact', () => {
  it('uses the JPY exponent when deciding what "large" means', () => {
    // 12 000 JPY is 12 000 major units — over the threshold, unlike 12 000 pence.
    expect(formatCompact(money(12_000, 'JPY'), 'en-US')).toMatch(/K/);
    expect(formatCompact(money(12_000, 'GBP'), 'en-US')).not.toMatch(/K/);
  });
});

describe('toMajorNumber', () => {
  it('divides by the currency exponent, not by a hundred', () => {
    expect(toMajorNumber(12_500, 'GBP')).toBe(125);
    expect(toMajorNumber(1_200, 'JPY')).toBe(1_200);
  });

  it('handles zero', () => {
    expect(toMajorNumber(0, 'GBP')).toBe(0);
  });
});

describe('shareOf', () => {
  it('returns zero rather than Infinity when the total is zero', () => {
    expect(shareOf(money(2_500, 'GBP'), money(0, 'GBP'))).toBe(0);
  });

  it('refuses to compare across currencies', () => {
    expect(() => shareOf(money(100, 'GBP'), money(100, 'USD'))).toThrow();
  });
});

describe('formatBps', () => {
  it('renders zero', () => {
    expect(formatBps(0)).toBe('0.00%');
  });

});
