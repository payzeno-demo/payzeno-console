/**
 * The dashboard's five summary tiles.
 *
 * TODO(rrefactor): use lib/money.ts — JPY is wrong here. `formatAmount` divides by 100
 * unconditionally, so every figure on a JPY merchant's dashboard is 100× too small. This is
 * the most visible of the three remaining `formatAmount` call sites. PAY-1968.
 *
 * a11y: each tile is an `<article>` with a heading, and the hint text is associated with the
 * figure rather than floating next to it.
 */
import type { CurrencyCode } from '@payzeno/contracts';

import { Card } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { formatAmount, formatCount, formatPercent } from '@lib/format';

import type { SummaryTile } from '../reporting.selectors';

export interface SummaryCardsProps {
  tiles: ReadonlyArray<SummaryTile>;
  currency: CurrencyCode | undefined;
  successRatio: number;
  refundRatio: number;
