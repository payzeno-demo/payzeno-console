/**
 * Currency picker.
 *
 * The list is `CURRENCIES` from `@payzeno/contracts` — five entries, and the console must never
 * invent a sixth. A currency the ledger has no `CURRENCY_EXPONENT` for produces amounts that
 * are wrong by two orders of magnitude rather than an error, which is the worst failure mode a
 * payments UI has.
 *
 * Balance, settlements and payouts are all per-currency reads, so this control appears in
 * three filter bars and its value lives in URL state.
 *
 * a11y: the option label carries the code *and* the name ("GBP — British pound"). "GBP" alone
 * is read out as "gee bee pee" and is genuinely hard to distinguish from "GRP" at speed.
 */
import { CURRENCIES } from '@payzeno/contracts';
import type { CurrencyCode } from '@payzeno/contracts';

import { pz } from '@lib/cn';

import { Select } from '../ui/Select';
import { color, font, space } from '../ui/tokens';

export interface CurrencySelectProps {
  id: string;
  value: CurrencyCode;
  onChange: (next: CurrencyCode) => void;
  /** Visible label. Omit for a toolbar select, which uses `ariaLabel` instead. */
  label?: string;
  /** Restrict to the currencies this merchant actually settles in. */
  available?: ReadonlyArray<CurrencyCode>;
  disabled?: boolean;
}

/** Display names. Deliberately not `Intl.DisplayNames` — it varies by browser and by locale. */
export const CURRENCY_NAMES: Readonly<Record<CurrencyCode, string>> = {
  USD: 'US dollar',
  EUR: 'Euro',
  GBP: 'British pound',
  ILS: 'Israeli shekel',
  JPY: 'Japanese yen',
};

export function currencyLabel(code: CurrencyCode): string {
  return `${code} — ${CURRENCY_NAMES[code]}`;
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCIES as ReadonlyArray<string>).includes(value);
}

