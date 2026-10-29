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

import { color, font, toneStyle } from '../ui/tokens';
import type { Tone } from '../ui/tokens';

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
  /**
   * Colour the amount in a semantic tone regardless of its sign — reconciliation variance, an
   * over-posted batch total. Wins over `emphasiseNegative` and `muteZero`. Never the only
   * signal: the row or panel must say in words why the figure is highlighted.
   */
  tone?: Tone;
}

export function MoneyCell({
  value,
  amountMinor,
  currency,
  signed = false,
  muteZero = true,
  emphasiseNegative = false,
  tone,
}: MoneyCellProps) {
  const formatter = useMoneyFormat();

  const resolved: Money | null =
    value ?? (amountMinor !== undefined && currency ? money(amountMinor, currency) : null);

  if (!resolved) {
    return <span style={{ color: color.textMuted }}>—</span>;
  }

  const isZeroAmount = resolved.amount_minor === 0;
  const isNegativeAmount = resolved.amount_minor < 0;
  const text = signed ? formatter.formatSigned(resolved) : formatter.format(resolved);

  return (
    <span
      className={pz('money-cell')}
      style={{
        fontFamily: font.familyMono,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        color: tone
          ? toneStyle(tone).fg
          : emphasiseNegative && isNegativeAmount
            ? color.danger
            : muteZero && isZeroAmount
              ? color.textMuted
              : color.textPrimary,
      }}
    >
      {text}
    </span>
  );
}

/** Plain-string form for a column's `exportValue`. Same formatter, no markup. */
export function moneyExportValue(amountMinor: MinorUnits, currency: CurrencyCode): string {
  // Exports are consumed by spreadsheets, so they get the raw minor units and the currency
  // in separate columns rather than a formatted string with a symbol in it.
  return `${amountMinor} ${currency}`;
}
