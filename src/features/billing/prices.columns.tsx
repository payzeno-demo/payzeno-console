/**
 * `ColumnDef<PriceRow>[]` — Billing → Prices (RFC platform-v2 §6).
 */
import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { Badge } from '@components/ui/Badge';
import type { PriceRow } from '@/types/view-models';

export const priceColumns: ReadonlyArray<ColumnDef<PriceRow>> = [
  {
    id: 'product_name',
    header: 'Product',
    cell: (row) => <span>{row.product_name}</span>,
    exportValue: (row) => row.product_name,
    sortable: true,
  },
  {
    id: 'unit_amount_minor',
    header: 'Price',
    align: 'end',
    cell: (row) => <MoneyCell amountMinor={row.unit_amount_minor} currency={row.currency} />,
    exportValue: (row) => String(row.unit_amount_minor),
    sortable: true,
  },
  {
    id: 'cadence',
    header: 'Billed',
    cell: (row) =>
      row.recurring ? (
        <Badge tone="info" size="sm">
          Recurring · {row._cadence}
        </Badge>
      ) : (
        <Badge tone="neutral" size="sm">
          One-off
        </Badge>
      ),
    exportValue: (row) => row._cadence,
  },
  {
    id: 'active',
    header: 'Status',
    cell: (row) => <span>{row.active ? 'Active' : 'Archived'}</span>,
    exportValue: (row) => (row.active ? 'active' : 'archived'),
  },
  {
    id: 'id',
    header: 'Price id',
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
