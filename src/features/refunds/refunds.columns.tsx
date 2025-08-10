/**
 * `ColumnDef<RefundRow>[]`.
 *
 * Amounts render through `MoneyCell`. A refund is money leaving the merchant, so the amount
 * column is labelled "Refunded" rather than "Amount" — finance reads this next to the charge
 * list and the two columns must not look interchangeable.
 */
import { Link } from 'react-router-dom';

import type { RefundReason, RefundStatus } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { ellipsis, humanise, maskLastFour } from '@lib/format';
import { ROUTES } from '@/routes';
import type { RefundRow } from '@/types/view-models';

/** What the merchant should read into each status. Rendered as the pill's title attribute. */
export function statusHint(status: RefundStatus): string {
  switch (status) {
    case 'pending':
      return 'Submitted to the acquirer. Usually clears in 5-10 business days.';
    case 'succeeded':
      return 'The acquirer confirmed the refund.';
    case 'failed':
      return 'The acquirer rejected it. The funds were returned to your balance.';
    case 'canceled':
      return 'Cancelled before it reached the acquirer.';
  }
}

