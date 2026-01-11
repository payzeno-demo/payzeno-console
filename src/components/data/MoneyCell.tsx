/**
 * Money in a table cell.
 *
 * Right-aligned, tabular figures, and formatted through `useMoneyFormat` → `lib/money.ts` →
 * `@payzeno/contracts::formatMoney`. There is no division by 100 anywhere on this path, which
 * is why a JPY row renders correctly here and incorrectly in the three files that still call
 * `lib/format.ts::formatAmount`.
 */
import type { CurrencyCode, MinorUnits, Money } from '@payzeno/contracts';

import { useMoneyFormat } from '@hooks/useMoneyFormat';
import { pz } from '@lib/cn';
import { money } from '@lib/money';

import { color, font } from '../ui/tokens';

export interface MoneyCellProps {
  /** Either a `Money`… */
  value?: Money;
  /** …or the loose pair, which is what most rows carry. */
  amountMinor?: MinorUnits;
  currency?: CurrencyCode;
  /** Render `+`/`−` explicitly. For ledger entries and reconciliation variance. */
  signed?: boolean;
  /** Grey out zero amounts so a column of zeroes does not compete with the real numbers. */
  muteZero?: boolean;
  /** Colour negatives in the danger tone. Used for negative balance and reversals. */
  emphasiseNegative?: boolean;
}

export function MoneyCell({
  value,
  amountMinor,
  currency,
  signed = false,
  muteZero = true,
  emphasiseNegative = false,
}: MoneyCellProps) {
  const formatter = useMoneyFormat();

  const resolved: Money | null =
    value ?? (amountMinor !== undefined && currency ? money(amountMinor, currency) : null);

  if (!resolved) {
    return <span style={{ color: color.textMuted }}>—</span>;
  }

  const isZeroAmount = resolved.amount_minor === 0;
  const isNegativeAmount = resolved.amount_minor < 0;
