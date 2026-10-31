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

/** Reason labels merchants recognise. `expired_uncaptured_auth` is system-generated. */
export function reasonLabel(reason: RefundReason): string {
  return reason === 'expired_uncaptured_auth' ? 'Expired authorisation' : humanise(reason);
}

export const refundColumns: ReadonlyArray<ColumnDef<RefundRow>> = [
  {
    id: 'id',
    header: 'Refund',
    cell: (row) => <IdCell value={row.id} />,
    exportValue: (row) => row.id,
    width: '16rem',
  },
  {
    id: 'charge_id',
    header: 'Charge',
    cell: (row) => (
      <Link to={ROUTES.charges.detail(row.charge_id)}>
        <IdCell value={row.charge_id} />
      </Link>
    ),
    exportValue: (row) => row.charge_id,
  },
  {
    id: 'card',
    header: 'Card',
    cell: (row) => <span>{maskLastFour(row._chargeLastFour)}</span>,
    exportValue: (row) => row._chargeLastFour ?? '',
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <StatusPill status={row.status} label={humanise(row.status)} title={statusHint(row.status)} />
    ),
    exportValue: (row) => row.status,
  },
  {
    id: 'reason',
    header: 'Reason',
    cell: (row) => <span>{reasonLabel(row.reason)}</span>,
    exportValue: (row) => row.reason,
  },
  {
    id: 'amount_minor',
    header: 'Refunded',
    align: 'end',
    sortable: true,
    cell: (row) => <MoneyCell amountMinor={row.amount_minor} currency={row.currency} />,
    exportValue: (row) => String(row.amount_minor),
  },
  {
    id: 'failure_reason',
    header: 'Failure',
    cell: (row) => <span>{row.failure_reason ? ellipsis(row.failure_reason, 48) : '—'}</span>,
    exportValue: (row) => row.failure_reason ?? '',
  },
  {
    id: 'created_at',
    header: 'Created',
    sortable: true,
    cell: (row) => <DateCell value={row.created_at} />,
    exportValue: (row) => row.created_at,
  },
];
