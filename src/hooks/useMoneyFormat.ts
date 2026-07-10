/**
 * Money formatting, bound to the session's locale.
 *
 * Every amount on screen goes through here so that a currency-exponent bug can only ever exist
 * in one place — and it does not, because the arithmetic lives in `@payzeno/contracts`.
 * `lib/format.ts::formatAmount` is the counter-example and it is on its way out.
 */
import { useCallback, useMemo } from 'react';

import type { CurrencyCode, Money, MinorUnits } from '@payzeno/contracts';

import { formatCompact, formatMoney, formatSigned, money } from '@lib/money';

export interface MoneyFormatter {
  /** `formatMoney` bound to the current locale. */
  format: (value: Money) => string;
  /** Minor units + currency, for the very common case of two loose fields. */
  formatMinor: (amount: MinorUnits, currency: CurrencyCode) => string;
  /** `+£12.00` / `−£12.00`, for ledger-style columns. */
  formatSigned: (value: Money) => string;
  /** `$12.4k`, for chart axes and dense cells. */
  formatCompact: (value: Money) => string;
  locale: string;
}

/**
 * @param locale BCP-47 tag. Defaults to the browser's, which is what a merchant's finance team
 * expects; the currency itself always comes from the data, never from the locale.
 */
export function useMoneyFormat(locale?: string): MoneyFormatter {
  const resolved = useMemo(
    () => locale ?? (typeof navigator === 'undefined' ? 'en-US' : navigator.language),
    [locale],
  );

  const format = useCallback((value: Money) => formatMoney(value, resolved), [resolved]);

  const formatMinorUnits = useCallback(
    (amount: MinorUnits, currency: CurrencyCode) => formatMoney(money(amount, currency), resolved),
    [resolved],
