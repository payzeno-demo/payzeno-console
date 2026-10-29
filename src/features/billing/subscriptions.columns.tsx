/**
 * `ColumnDef<SubscriptionRow>[]` — Billing → Subscriptions and the customer page (RFC
 * platform-v2 §6).
 */
import { Link } from 'react-router-dom';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { StatusPill } from '@components/data/StatusPill';
import { ROUTES } from '@/routes';
import type { SubscriptionRow } from '@/types/view-models';

import { subscriptionStatusLabel } from './billing.format';

export const subscriptionColumns: ReadonlyArray<ColumnDef<SubscriptionRow>> = [
  {
    id: 'id',
    header: 'Subscription',
    cell: (row) => (
      <Link to={ROUTES.billing.subscription(row.id)}>
        <IdCell value={row.id} />
      </Link>
    ),
    exportValue: (row) => row.id,
    width: '18rem',
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <StatusPill
        status={row.status}
        srPrefix="Subscription status"
        label={subscriptionStatusLabel(row)}
      />
    ),
    exportValue: (row) => row.status,
  },
  {
    id: 'price',
    header: 'Product',
    cell: (row) => <span>{row._priceLabel ?? row.price_id}</span>,
    exportValue: (row) => row._priceLabel ?? row.price_id,
  },
  {
    id: 'customer_id',
    header: 'Customer',
    cell: (row) => (
      <Link to={ROUTES.customers.detail(row.customer_id)}>
        <IdCell value={row.customer_id} />
      </Link>
    ),
    exportValue: (row) => row.customer_id,
  },
  {
    id: 'current_period_end',
    header: 'Renews / ends',
    cell: (row) =>
      // Absolute: these are future dates, and the relative formatter has no "in 3 weeks".
      row.status === 'canceled' ? (
        <span>—</span>
      ) : (
        <DateCell value={row.current_period_end} absolute />
      ),
    exportValue: (row) => row.current_period_end,
    sortable: true,
  },
  {
    id: 'next_retry_at',
    header: 'Next retry',
    cell: (row) =>
      row.next_retry_at ? <DateCell value={row.next_retry_at} absolute /> : <span>—</span>,
    exportValue: (row) => row.next_retry_at ?? '',
  },
];
