/**
 * Columns for the admin merchants table. Every column that renders anything but text carries an
 * `exportValue`, which `DataTable` also sorts on.
 */
import type { ColumnDef } from '@components/data/column.types';
import { DateCell, dateExportValue } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { color, font } from '@components/ui/tokens';

import { AdminStatusPill } from '../../components/AdminStatusPill';
import type { AdminMerchantRow } from '../../types/admin-views';

export const merchantColumns: ReadonlyArray<ColumnDef<AdminMerchantRow>> = [
  {
    id: 'merchant',
    header: 'Merchant',
    sortable: true,
    exportValue: (row) => row.merchant.display_name,
    cell: (row) => (
      <span style={{ display: 'inline-grid' }}>
        <span style={{ fontWeight: font.weight.semibold }}>{row.merchant.display_name}</span>
        <span style={{ fontSize: font.size.sm, color: color.textSecondary }}>
          {row.merchant.legal_name}
        </span>
      </span>
    ),
  },
  {
    id: 'id',
    header: 'ID',
    exportValue: (row) => row.merchant.id,
    cell: (row) => <IdCell value={row.merchant.id} resourceLabel="merchant id" />,
  },
  {
    id: 'country',
    header: 'Country',
    sortable: true,
    exportValue: (row) => row.merchant.country,
    cell: (row) => row.merchant.country,
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    exportValue: (row) => row.merchant.status,
    cell: (row) => <AdminStatusPill kind="merchant" status={row.merchant.status} size="sm" />,
  },
  {
    id: 'onboarding',
    header: 'Onboarding',
    sortable: true,
    exportValue: (row) => row.onboarding_state,
    cell: (row) => <AdminStatusPill kind="onboarding" status={row.onboarding_state} size="sm" />,
  },
  {
    id: 'submitted',
    header: 'Submitted',
    sortable: true,
    exportValue: (row) => dateExportValue(row.submitted_at),
    cell: (row) => <DateCell value={row.submitted_at} />,
  },
  {
    id: 'owner',
    header: 'Owner email',
    sortable: true,
    exportValue: (row) => row.owner_email ?? '',
    cell: (row) => row.owner_email ?? '—',
  },
  {
    id: 'created',
    header: 'Created',
    sortable: true,
    exportValue: (row) => dateExportValue(row.merchant.created_at),
    cell: (row) => <DateCell value={row.merchant.created_at} />,
  },
];
