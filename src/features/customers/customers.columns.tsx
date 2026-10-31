/**
 * `ColumnDef<CustomerRow>[]` — the customers list (RFC platform-v2 §5).
 */
import { Link } from 'react-router-dom';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { ROUTES } from '@/routes';
import type { CustomerRow } from '@/types/view-models';

export const customerColumns: ReadonlyArray<ColumnDef<CustomerRow>> = [
  {
    id: 'name',
    header: 'Customer',
    cell: (row) => <Link to={ROUTES.customers.detail(row.id)}>{row._label}</Link>,
    exportValue: (row) => row.name ?? '',
    sortable: true,
  },
  {
    id: 'email',
    header: 'Email',
    cell: (row) => <span>{row.email ?? '—'}</span>,
    exportValue: (row) => row.email ?? '',
    sortable: true,
  },
  {
    id: 'default_payment_method_id',
    header: 'Saved card',
    cell: (row) => <span>{row.default_payment_method_id ? 'Yes' : 'None'}</span>,
    exportValue: (row) => (row.default_payment_method_id ? 'yes' : 'no'),
  },
  {
    id: 'id',
    header: 'Customer id',
    cell: (row) => <IdCell value={row.id} />,
    exportValue: (row) => row.id,
  },
  {
    id: 'created_at',
    header: 'Created',
    cell: (row) => <DateCell value={row.created_at} />,
    exportValue: (row) => row.created_at,
    sortable: true,
  },
];
