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
