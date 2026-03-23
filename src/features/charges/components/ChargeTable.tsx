import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { DataTableToolbar } from '@components/data/DataTableToolbar';
import { EmptyRows } from '@components/data/EmptyRows';
import { ExportCsvButton } from '@components/data/ExportCsvButton';
import { ROUTES } from '@/routes';
import type { ChargeRow } from '@types/view-models';

import { chargeColumns } from '../charges.columns';

export interface ChargeTableProps {
  rows: ReadonlyArray<ChargeRow>;
  isLoading: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  onCursorChange: (cursor: string | null) => void;
}

export function ChargeTable({
  rows,
  isLoading,
  hasMore,
  nextCursor,
  onCursorChange,
}: ChargeTableProps) {
  const navigate = useNavigate();

  return (
    <>
      <DataTableToolbar label="Charge actions">
        <ExportCsvButton filename="charges.csv" columns={chargeColumns} rows={rows} />
      </DataTableToolbar>

      <DataTable<ChargeRow>
        caption="Charges, newest first"
        columns={chargeColumns}
        rows={rows}
        isLoading={isLoading}
        onRowClick={(row) => navigate(ROUTES.charges.detail(row.id))}
        emptyState={
          <EmptyRows
            title="No charges match"
            body="A charge appears once a payment intent is authorised."
          />
        }
      />

      <DataTablePagination
        hasMore={hasMore}
        onNext={() => onCursorChange(nextCursor)}
        onReset={() => onCursorChange(null)}
        isBusy={isLoading}
      />
    </>
  );
}
