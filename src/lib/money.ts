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
