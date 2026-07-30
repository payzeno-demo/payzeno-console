/**
 * The per-batch item table. Frame 3 of the canonical chain — it renders `RetryItemButton`
 * via `settlementItemColumns(batchId)`.
 *
 * The status filter is a segmented control over the statuses finance actually filters on;
 * `settling` is deliberately in the list because during an incident that is the one people
 * want to watch.
 */
import type { ReconciliationItemStatus } from '@payzeno/contracts';

import { DataTable } from '@components/data/DataTable';
import { DataTableToolbar } from '@components/data/DataTableToolbar';
import { EmptyRows } from '@components/data/EmptyRows';
import { ExportCsvButton } from '@components/data/ExportCsvButton';
import { Select } from '@components/ui/Select';
import type { SettlementItemRow } from '@types/view-models';

import { settlementItemColumns } from '../settlement-items.columns';

const FILTERABLE_STATUSES: ReadonlyArray<ReconciliationItemStatus | 'all'> = [
  'all',
  'settled',
  'settling',
  'retryable',
  'failed',
  'orphaned',
  'needs_review',
  'variance_exceeded',
];

export interface SettlementItemTableProps {
  batchId: string;
  rows: ReadonlyArray<SettlementItemRow>;
  isLoading: boolean;
  status: ReconciliationItemStatus | 'all';
  onStatusChange: (next: ReconciliationItemStatus | 'all') => void;
}

export function SettlementItemTable({
  batchId,
  rows,
  isLoading,
  status,
  onStatusChange,
}: SettlementItemTableProps) {
  const columns = settlementItemColumns(batchId);

  return (
    <>
      <DataTableToolbar label="Item filters">
        <Select
          id="settlement-item-status"
          label="Status"
          value={status}
          onValueChange={(next) => onStatusChange(next as ReconciliationItemStatus | 'all')}
          options={FILTERABLE_STATUSES.map((value) => ({
            value,
            label: value === 'all' ? 'All statuses' : value.replace(/_/g, ' '),
          }))}
        />
        <ExportCsvButton
          filename={`settlement-${batchId}-items.csv`}
          columns={columns}
          rows={rows}
        />
      </DataTableToolbar>

      <DataTable<SettlementItemRow>
        caption={`Reconciliation items in settlement batch ${batchId}`}
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        emptyState={
          <EmptyRows
            title="No items match this filter"
            body="Clear the status filter to see every line in the batch."
          />
        }
      />
    </>
  );
}
