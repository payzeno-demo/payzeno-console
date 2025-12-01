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
