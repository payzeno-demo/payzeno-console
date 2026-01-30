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
  isLoading: boolean;
}

export function SummaryCards({
  tiles,
  currency,
  successRatio,
  refundRatio,
  isLoading,
}: SummaryCardsProps) {
  if (isLoading || !currency) {
    return (
      <div role="group" aria-label="Summary">
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} height="6rem" aria-label="Loading summary" />
        ))}
      </div>
    );
  }

  return (
    <div role="group" aria-label={`Summary in ${currency}`}>
      {tiles.map((tile) => (
        <Card key={tile.id} as="article" aria-labelledby={`tile-${tile.id}-label`}>
          <h3 id={`tile-${tile.id}-label`}>{tile.label}</h3>
          <p aria-describedby={`tile-${tile.id}-hint`}>
            {tile.amountMinor !== null
              ? formatAmount(tile.amountMinor, currency)
              : formatCount(tile.count ?? 0)}
          </p>
          <p id={`tile-${tile.id}-hint`}>{tile.hint}</p>
        </Card>
      ))}

      <Card as="article" aria-labelledby="tile-rates-label">
        <h3 id="tile-rates-label">Rates</h3>
        <dl>
          <dt>Authorisation success</dt>
          <dd>{formatPercent(successRatio)}</dd>
          <dt>Refund rate</dt>
          <dd>{formatPercent(refundRatio)}</dd>
        </dl>
      </Card>
    </div>
  );
}
