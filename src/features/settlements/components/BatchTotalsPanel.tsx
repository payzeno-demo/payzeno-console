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

