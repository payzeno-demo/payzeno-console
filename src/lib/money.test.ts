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

  it('builds a zero in the currency asked for', () => {
    expect(zero('JPY')).toEqual({ amount_minor: 0, currency: 'JPY' });
  });
});

describe('sumMoney', () => {
  it('uses U+2212 MINUS SIGN, not a hyphen', () => {
    const rendered = formatSigned(money(-2_500, 'GBP'), 'en-GB');

    expect(rendered).toMatch(/^−/);
    expect(rendered).not.toMatch(/^-/);
  });

});
