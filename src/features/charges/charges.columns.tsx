import { Link } from 'react-router-dom';

import type { ChargeStatus, DeclineCode } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { AcquirerCell } from '@components/data/AcquirerCell';
import { CardBrandCell } from '@components/data/CardBrandCell';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { ROUTES } from '@/routes';
import type { ChargeRow } from '@types/view-models';

/** Plain-English decline reasons. Merchants forward these to their customers verbatim. */
export function explainDecline(code: DeclineCode): string {
  switch (code) {
    case 'do_not_honor':
      return 'The issuer declined without a reason.';
    case 'insufficient_funds':
      return 'Not enough funds on the card.';
    case 'lost_card':
    case 'stolen_card':
      return 'The card was reported lost or stolen.';
    case 'expired_card':
      return 'The card has expired.';
    case 'incorrect_cvc':
      return 'The security code did not match.';
    case 'processing_error':
      return 'The card network had a processing error.';
    case 'issuer_unavailable':
      return 'The issuing bank could not be reached.';
    case 'velocity_exceeded':
      return 'Too many attempts on this card.';
    case 'fraud_suspected':
      return 'The issuer flagged the transaction as fraud.';
    default:
      return 'The payment was declined.';
  }
}

const SETTLED_STATUSES: ReadonlySet<ChargeStatus> = new Set(['settled']);

export function isSettled(status: ChargeStatus): boolean {
  return SETTLED_STATUSES.has(status);
}

export const chargeColumns: ReadonlyArray<ColumnDef<ChargeRow>> = [
  {
    id: 'id',
    header: 'Charge',
    cell: (row) => (
      <Link to={ROUTES.charges.detail(row.id)}>
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
    id: 'refunded_amount_minor',
    header: 'Refunded',
    align: 'end',
    cell: (row) =>
      row.refunded_amount_minor === 0 ? (
        <span>—</span>
      ) : (
        <MoneyCell amountMinor={row.refunded_amount_minor} currency={row.currency} />
      ),
    exportValue: (row) => String(row.refunded_amount_minor),
  },
  {
    id: 'card',
    header: 'Card',
    cell: (row) => <CardBrandCell brand={row.card.brand} lastFour={row.card.last_four} />,
    exportValue: (row) => `${row.card.brand} ••••${row.card.last_four}`,
  },
  {
    id: 'acquirer',
    header: 'Acquirer',
    cell: (row) => <AcquirerCell acquirer={row.acquirer} />,
    exportValue: (row) => row.acquirer,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <StatusPill
        status={row.status}
        label={row.status}
        title={row.failure_code ? explainDecline(row.failure_code) : undefined}
      />
    ),
    exportValue: (row) => row.status,
  },
  {
    id: 'settlement_batch_id',
    header: 'Settlement',
    cell: (row) =>
      row.settlement_batch_id ? (
        <Link to={ROUTES.settlements.detail(row.settlement_batch_id)}>
          <IdCell value={row.settlement_batch_id} />
        </Link>
      ) : (
        <span>—</span>
      ),
    exportValue: (row) => row.settlement_batch_id ?? '',
  },
  {
