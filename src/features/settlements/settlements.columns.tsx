/**
 * `ColumnDef<SettlementRow>[]` for the settlements list.
 *
 * Renamed from `columns.tsx` in the PAY-2043 PR. Every money cell goes through `MoneyCell`,
 * which goes through `useMoneyFormat` -> `lib/money.ts` -> `@payzeno/contracts::formatMoney`.
 * There is no `amount / 100` anywhere in this file, because JPY exists.
 */
import { Link } from 'react-router-dom';

import type { SettlementBatchStatus } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { AcquirerCell } from '@components/data/AcquirerCell';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { ROUTES } from '@/routes';
import type { SettlementRow } from '@types/view-models';

/** Which statuses read as "money has actually moved". Merchants conflate the rest. */
const TERMINAL_STATUSES: ReadonlySet<SettlementBatchStatus> = new Set(['funded', 'failed']);

export function isTerminal(status: SettlementBatchStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export const settlementColumns: ReadonlyArray<ColumnDef<SettlementRow>> = [
  {
    id: 'id',
    header: 'Batch',
    cell: (row) => (
      <Link to={ROUTES.settlements.detail(row.id)}>
        <IdCell value={row.id} />
      </Link>
    ),
    exportValue: (row) => row.id,
    width: '18rem',
  },
  {
    id: 'processing_date',
    header: 'Processing date',
    cell: (row) => <DateCell value={row.processing_date} precision="day" />,
    exportValue: (row) => row.processing_date,
    sortable: true,
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
    cell: (row) => <StatusPill status={row.status} label={row.status.replace(/_/g, ' ')} />,
    exportValue: (row) => row.status,
  },
  {
    id: 'item_count',
    header: 'Your items',
    align: 'end',
    cell: (row) => <span>{row.item_count.toLocaleString()}</span>,
    exportValue: (row) => String(row.item_count),
    sortable: true,
  },
  {
    id: 'net_minor',
    header: 'Net',
    align: 'end',
    cell: (row) => <MoneyCell amountMinor={row.net_minor} currency={row.currency} />,
    exportValue: (row) => String(row.net_minor),
    sortable: true,
  },
  {
    id: 'funded_at',
    header: 'Funded',
    cell: (row) =>
      row.funded_at ? <DateCell value={row.funded_at} precision="minute" /> : <span>—</span>,
    exportValue: (row) => row.funded_at ?? '',
  },
];
