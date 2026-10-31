/**
 * `ColumnDef<PayoutRow>[]`.
 *
 * `available_on` and `arrival_estimate` are `IsoDate` — banking calendar days, not instants.
 * They render through `DateCell mode="banking"`, which splits the string instead of parsing
 * it; PAY-1904 ("payouts show yesterday") was exactly this mistake.
 */
import { Link } from 'react-router-dom';

import type { PayoutFailureCode, PayoutStatus } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { humanise, labelise } from '@lib/format';
import { ROUTES } from '@/routes';
import type { PayoutRow } from '@/types/view-models';

/** What each failure code means in words a merchant can act on. */
export function failureHint(code: PayoutFailureCode): string {
  switch (code) {
    case 'account_closed':
      return 'The bank account is closed. Add a new one before the next payout.';
    case 'no_account':
      return 'The bank could not find the account. Check the details.';
    case 'invalid_details':
      return 'The account details were rejected by the bank.';
    case 'debit_not_authorized':
      return 'Your bank refused the debit. A mandate may be missing.';
    case 'insufficient_funds':
      return 'The debit could not be taken — the account was short.';
    case 'bank_rejected':
      return 'The receiving bank rejected the transfer without a reason code.';
  }
}

/** Statuses where money is still in motion; the row keeps its live accent. */
export const IN_FLIGHT_STATUSES: ReadonlySet<PayoutStatus> = new Set(['scheduled', 'in_transit']);

export const payoutColumns: ReadonlyArray<ColumnDef<PayoutRow>> = [
  {
    id: 'id',
    header: 'Payout',
    width: '16rem',
    cell: (row) => (
      <Link to={ROUTES.payouts.detail(row.id)}>
        <IdCell value={row.id} />
      </Link>
    ),
    exportValue: (row) => row.id,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <StatusPill
        status={row.status}
        label={humanise(row.status)}
        title={row.failure_code ? failureHint(row.failure_code) : undefined}
      />
    ),
    exportValue: (row) => row.status,
  },
  {
    id: 'amount_minor',
    header: 'Amount',
    align: 'end',
    sortable: true,
    // RFC platform-v2 §7: a converted payout lands in the bank's currency; the balance it came
    // out of is `source_*`, shown underneath so the two never read as one amount.
    cell: (row) => (
      <>
        <MoneyCell amountMinor={row.amount_minor} currency={row.currency} />
        {typeof row.source_amount_minor === 'number' && row.source_currency ? (
          <span style={{ display: 'block' }}>
            from <MoneyCell amountMinor={row.source_amount_minor} currency={row.source_currency} />
            {row.fx_rate ? ` at ${row.fx_rate}` : ''}
          </span>
        ) : null}
      </>
    ),
    exportValue: (row) => String(row.amount_minor),
  },
  {
    id: 'bank',
    header: 'To',
    cell: (row) => <span>{row._bankLabel}</span>,
    exportValue: (row) => row._bankLabel,
  },
  {
    id: 'method',
    header: 'Method',
    cell: (row) => <span>{labelise(row.method)}</span>,
    exportValue: (row) => row.method,
  },
  {
    id: 'available_on',
    header: 'Available on',
    sortable: true,
    cell: (row) => <DateCell value={row.available_on} mode="banking" />,
    exportValue: (row) => row.available_on,
  },
  {
    id: 'arrival_estimate',
    header: 'Expected arrival',
    cell: (row) =>
      row.arrival_estimate ? (
        <DateCell value={row.arrival_estimate} mode="banking" />
      ) : (
        <span>—</span>
      ),
    exportValue: (row) => row.arrival_estimate ?? '',
  },
  {
    id: 'failure_code',
    header: 'Failure',
    cell: (row) => <span>{row.failure_code ? humanise(row.failure_code) : '—'}</span>,
    exportValue: (row) => row.failure_code ?? '',
  },
];
