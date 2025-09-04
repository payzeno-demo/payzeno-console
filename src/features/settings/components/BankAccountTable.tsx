/**
 * Bank accounts table.
 *
 * Columns are declared inline rather than in a `settings.columns.tsx`, because this is the
 * only table in the feature and the blueprint's five-slot shape earns its keep at three
 * tables, not one.
 *
 * a11y: the "Make default" control is a real button per row with an accessible name that
 * includes the bank, so a screen-reader user is not choosing between six identical buttons.
 */
import type { BankAccountStatus } from '@payzeno/contracts';

import { DataTable } from '@components/data/DataTable';
import type { ColumnDef } from '@components/data/DataTable';
import { EmptyRows } from '@components/data/EmptyRows';
import { DateCell } from '@components/data/DateCell';
import { StatusPill } from '@components/data/StatusPill';
import { Button } from '@components/ui/Button';
import { humanise, maskLastFour } from '@lib/format';
import type { BankAccountRow } from '@/types/view-models';

/** What each status means for whether a payout can actually leave. */
export function statusHint(status: BankAccountStatus): string {
  switch (status) {
    case 'new':
      return 'Verification in progress. Payouts cannot use it yet.';
    case 'validated':
      return 'Verified and usable for payouts.';
    case 'verification_failed':
      return 'The bank could not verify these details.';
    case 'errored':
      return 'Something went wrong during verification. Remove and re-add it.';
  }
}

export interface BankAccountTableProps {
  rows: ReadonlyArray<BankAccountRow>;
  isLoading: boolean;
  canManage: boolean;
  onMakeDefault: (bankAccountId: string) => void;
}

export function BankAccountTable({
  rows,
  isLoading,
  canManage,
  onMakeDefault,
}: BankAccountTableProps) {
  const columns: ReadonlyArray<ColumnDef<BankAccountRow>> = [
    {
      id: 'bank_name',
      header: 'Bank',
      cell: (row) => (
        <span>
          {row.bank_name} {maskLastFour(row.last_four)}
        </span>
      ),
      exportValue: (row) => row.bank_name,
    },
    {
      id: 'coordinates',
      header: 'Details',
      cell: (row) => <span>{row._coordinates}</span>,
      exportValue: (row) => row._coordinates,
    },
    {
      id: 'currency',
      header: 'Currency',
      cell: (row) => <span>{row.currency}</span>,
      exportValue: (row) => row.currency,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <StatusPill
          status={row.status}
          label={humanise(row.status)}
          title={statusHint(row.status)}
        />
      ),
      exportValue: (row) => row.status,
    },
    {
      id: 'created_at',
      header: 'Added',
      cell: (row) => <DateCell value={row.created_at} precision="day" />,
      exportValue: (row) => row.created_at,
    },
    {
      id: 'default',
      header: 'Default',
      cell: (row) =>
        row.is_default ? (
          <span>Default for {row.currency}</span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            disabled={!canManage || row.status !== 'validated'}
            aria-label={`Make ${row.bank_name} the default ${row.currency} account`}
            onClick={() => onMakeDefault(row.id)}
          >
            Make default
          </Button>
        ),
      exportValue: (row) => (row.is_default ? 'yes' : 'no'),
    },
  ];

  return (
    <DataTable<BankAccountRow>
      caption="Bank accounts that can receive your payouts"
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      emptyState={
        <EmptyRows
          title="No bank accounts"
          body="Add one to receive payouts. Verification takes a day or two."
        />
      }
    />
  );
}
