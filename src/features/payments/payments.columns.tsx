/**
 * `ColumnDef<PaymentIntentRow>[]`. One of the repo's hot files — every payments PR and every
 * `@payzeno/contracts` field rename lands here (`osquash`'s version-bump PRs in particular).
 */
import { Link } from 'react-router-dom';

import type { PaymentIntentStatus } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { ROUTES } from '@/routes';
import type { PaymentIntentRow } from '@types/view-models';

/** What a merchant should do next, in the words they use rather than ours. */
export function statusHint(status: PaymentIntentStatus): string {
  switch (status) {
    case 'requires_payment_method':
      return 'Waiting for card details.';
    case 'requires_confirmation':
      return 'Created but not confirmed.';
    case 'requires_action':
      return 'The bank asked the customer to authenticate.';
    case 'requires_capture':
      return 'Authorised. Capture to take the money.';
    case 'processing':
      return 'With the acquirer.';
    case 'succeeded':
      return 'Captured.';
    case 'failed':
      return 'Declined or errored.';
    case 'canceled':
      return 'The authorisation was released.';
    default:
      return '';
  }
}

export const paymentIntentColumns: ReadonlyArray<ColumnDef<PaymentIntentRow>> = [
  {
    id: 'id',
    header: 'Payment',
    cell: (row) => (
      <Link to={ROUTES.payments.detail(row.id)}>
        <IdCell value={row.id} />
      </Link>
    ),
    exportValue: (row) => row.id,
    width: '18rem',
  },
  {
    id: 'amount_minor',
    header: 'Amount',
    align: 'end',
    cell: (row) => <MoneyCell amountMinor={row.amount_minor} currency={row.currency} />,
    exportValue: (row) => String(row.amount_minor),
    sortable: true,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <StatusPill
        status={row.status}
        label={row.status.replace(/_/g, ' ')}
        title={statusHint(row.status)}
      />
    ),
    exportValue: (row) => row.status,
  },
  {
    id: 'capture_method',
    header: 'Capture',
    cell: (row) => <span>{row.capture_method}</span>,
