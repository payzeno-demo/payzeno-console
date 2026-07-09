/**
 * Added by PAY-2043 (the-incident.md §8): surfaces posted vs expected on the settlement
 * detail page.
 *
 * The batch object the console receives is a `MerchantSettlementBatch` and deliberately does
 * **not** carry `expected_total_minor` / `posted_total_minor` — those are acquirer-level and
 * would expose every other merchant in the file. So the panel rolls the merchant's own items
 * up instead, which is the same arithmetic scoped to one tenant.
 *
 * When posted exceeds expected, that is the signature of the double-settle. Say so plainly.
 */
import type { CurrencyCode } from '@payzeno/contracts';

import { Alert } from '@components/ui/Alert';
import { Card } from '@components/ui/Card';
import { MoneyCell } from '@components/data/MoneyCell';

import type { SettlementItemTotals } from '../useSettlementItems';

export interface BatchTotalsPanelProps {
  totals: SettlementItemTotals;
  currency: CurrencyCode;
  isLoading: boolean;
}

/** 0.1% — the same threshold as the `ledger_batch_overposted` CloudWatch alarm (PAY-2055). */
const OVERPOST_TOLERANCE = 1.001;

export function BatchTotalsPanel({ totals, currency, isLoading }: BatchTotalsPanelProps) {
  const overposted =
    totals.expectedMinor > 0 && totals.postedMinor > totals.expectedMinor * OVERPOST_TOLERANCE;

  return (
    <Card as="section" aria-label="Batch totals" data-loading={isLoading}>
      <h2>Your totals in this batch</h2>

      <dl>
        <dt>Expected</dt>
        <dd>
          <MoneyCell amountMinor={totals.expectedMinor} currency={currency} />
        </dd>

        <dt>Posted</dt>
        <dd>
          <MoneyCell
            amountMinor={totals.postedMinor}
            currency={currency}
            tone={overposted ? 'critical' : undefined}
          />
        </dd>

        <dt>Acquirer fees</dt>
        <dd>
          <MoneyCell amountMinor={totals.feeMinor} currency={currency} />
        </dd>

        <dt>Variance</dt>
        <dd>
          <MoneyCell amountMinor={totals.varianceMinor} currency={currency} />
        </dd>
