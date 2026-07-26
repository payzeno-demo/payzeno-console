/**
 * Money.
 *
 * The console performs **no** money arithmetic of its own. There is one implementation, in
 * `@payzeno/contracts`, shared by the API and (via the Python codegen) the ledger. This module
 * re-exports it and adds presentation-only helpers on top.
 *
 * If you are about to write `amount / 100` in this repo: `CURRENCY_EXPONENT.JPY` is 0. See
 * `lib/format.ts::formatAmount` for what that mistake looks like in production.
 */
// Types and the currency tables come from the barrel; the arithmetic comes from the
// `/money` entrypoint. They are separate subpaths in the package `exports` map on purpose
// (payzeno-contracts tsup.config.ts) — the barrel is `src/types/**` and nothing else.
import { CURRENCY_EXPONENT, CURRENCIES } from '@payzeno/contracts';
import type { BasisPoints, CurrencyCode, MinorUnits, Money } from '@payzeno/contracts';
import {
  addMoney,
  applyBps,
  assertSameCurrency,
  formatMoney,
  fromMinor,
  isZero,
  subMoney,
  toMinor,
} from '@payzeno/contracts/money';

export {
  CURRENCIES,
  CURRENCY_EXPONENT,
  addMoney,
  applyBps,
  assertSameCurrency,
  formatMoney,
  fromMinor,
  isZero,
  subMoney,
  toMinor,
};
export type { BasisPoints, CurrencyCode, MinorUnits, Money };

/** Build a `Money` without spelling the field names out at forty call sites. */
export function money(amount_minor: MinorUnits, currency: CurrencyCode): Money {
  return { amount_minor, currency };
}

/** Zero in a given currency. Used as the reduce seed in every totals panel. */
export function zero(currency: CurrencyCode): Money {
  return money(0, currency);
}

/**
 * Sum a list. Throws `CurrencyMismatchError` (from contracts) on the first mismatch rather
 * than silently adding EUR to USD — a totals panel that lies is worse than one that crashes
 * into the error boundary.
 */
export function sumMoney(values: ReadonlyArray<Money>, currency: CurrencyCode): Money {
  return values.reduce<Money>((acc, value) => addMoney(acc, value), zero(currency));
}

/** Negate. `Money` is unsigned by convention only; refunds and reversals render as negatives. */
export function negate(value: Money): Money {
  return money(-value.amount_minor, value.currency);
}

export function isNegative(value: Money): boolean {
  return value.amount_minor < 0;
}

/**
 * Format with an explicit sign, for ledger-style columns where a credit and a debit sit in the
 * same column and the reader needs to tell them apart at a glance.
 */
export function formatSigned(value: Money, locale?: string): string {
  const formatted = formatMoney(money(Math.abs(value.amount_minor), value.currency), locale);
  return value.amount_minor < 0 ? `−${formatted}` : `+${formatted}`;
}

/**
 * Compact form for chart axes and dense cells: `$12.4k`, `¥1.2M`.
 * Falls back to the full format below 10,000 major units, where compaction loses more than it
 * saves.
 */
export function formatCompact(value: Money, locale = 'en-US'): string {
  const exponent = CURRENCY_EXPONENT[value.currency];
  const major = value.amount_minor / 10 ** exponent;

  if (Math.abs(major) < 10_000) {
    return formatMoney(value, locale);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: value.currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(major);
}

/**
 * Minor units → a plain number in major units, for charting libraries that only speak floats.
