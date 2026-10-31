/**
 * `ColumnDef<ReviewRow>[]` — the payments page's "Held for review" view (RFC platform-v2 §8).
 */
import { Link } from 'react-router-dom';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { ROUTES } from '@/routes';
import type { ReviewRow } from '@/types/view-models';

import { REVIEW_STATUS_LABELS, riskRuleLabel } from './risk';

export const reviewColumns: ReadonlyArray<ColumnDef<ReviewRow>> = [
  {
    id: 'payment_intent_id',
    header: 'Payment',
    cell: (row) => (
      <Link to={ROUTES.payments.detail(row.payment_intent_id)}>
        <IdCell value={row.payment_intent_id} />
      </Link>
    ),
    exportValue: (row) => row.payment_intent_id,
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
    header: 'Review',
    cell: (row) => (
      <StatusPill
        status={row.status}
        srPrefix="Review status"
        label={REVIEW_STATUS_LABELS[row.status]}
      />
    ),
    exportValue: (row) => row.status,
  },
  {
    id: 'rules',
    header: 'Why',
    cell: (row) => <span>{row.rules.map(riskRuleLabel).join(' ')}</span>,
    exportValue: (row) => row.rules.join(';'),
  },
  {
    id: 'risk_score',
    header: 'Risk score',
    align: 'end',
    cell: (row) => <span>{row.risk_score}</span>,
    exportValue: (row) => String(row.risk_score),
    sortable: true,
  },
  {
    id: 'opened_at',
    header: 'Held since',
    cell: (row) => <DateCell value={row.opened_at} />,
    exportValue: (row) => row.opened_at,
    sortable: true,
  },
];
