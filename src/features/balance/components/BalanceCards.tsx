/**
 * The four balance cards: available, pending, reserved, disputed.
 *
 * Every figure goes through `MoneyCell`. The words matter as much as the numbers here —
 * "pending" is captured-but-not-settled, "reserved" is a rolling reserve hold, and merchants
 * conflate the two constantly, so each card carries a one-line explanation.
 *
 * a11y: the group has a label, each card is an `<article>` with its own heading, and the
 * amount is not the only thing announced.
 */
import type { CurrencyCode, MinorUnits } from '@payzeno/contracts';

import { Card } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { MoneyCell } from '@components/data/MoneyCell';
import type { BalanceView } from '@/types/view-models';

interface CardSpec {
  id: string;
  title: string;
  explanation: string;
  amountOf: (balance: BalanceView) => MinorUnits;
}

const CARDS: ReadonlyArray<CardSpec> = [
  {
    id: 'available',
    title: 'Available',
    explanation: 'Settled and payable now. This is what a payout can draw on.',
    amountOf: (b) => b.available_minor,
  },
  {
    id: 'pending',
    title: 'Pending',
    explanation: 'Captured but not yet settled by the acquirer.',
    amountOf: (b) => b.pending_minor,
  },
  {
    id: 'reserved',
    title: 'Reserved',
    explanation: 'Held under your rolling reserve. Released on schedule.',
    amountOf: (b) => b.reserved_minor,
  },
  {
    id: 'disputed',
    title: 'Disputed',
    explanation: 'Held against open chargebacks. Returned if you win.',
    amountOf: (b) => b.disputed_minor,
  },
];

export interface BalanceCardsProps {
  balance: BalanceView | undefined;
  currency: CurrencyCode;
  isLoading: boolean;
}

export function BalanceCards({ balance, currency, isLoading }: BalanceCardsProps) {
  if (isLoading || !balance) {
    return (
      <div role="group" aria-label="Balance">
        {CARDS.map((card) => (
          <Skeleton key={card.id} height="7rem" aria-label={`Loading ${card.title} balance`} />
        ))}
      </div>
    );
  }

  return (
    <div role="group" aria-label={`Balance in ${currency}`}>
      {CARDS.map((card) => (
        <Card key={card.id} as="article" aria-labelledby={`balance-${card.id}-title`}>
          <h3 id={`balance-${card.id}-title`}>{card.title}</h3>
          <p>
            <MoneyCell amountMinor={card.amountOf(balance)} currency={balance.currency} />
          </p>
          <p>{card.explanation}</p>
        </Card>
      ))}
    </div>
  );
}
