import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import { ExportCsvButton } from '@components/data/ExportCsvButton';
import { DataTableToolbar } from '@components/data/DataTableToolbar';
import { ROUTES } from '@/routes';
import type { PaymentIntentRow } from '@types/view-models';

import { paymentIntentColumns } from '../payments.columns';

export interface PaymentIntentTableProps {
  rows: ReadonlyArray<PaymentIntentRow>;
  isLoading: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  onCursorChange: (cursor: string | null) => void;
}

export function PaymentIntentTable({
  rows,
  isLoading,
  hasMore,
  nextCursor,
  onCursorChange,
}: PaymentIntentTableProps) {
  const navigate = useNavigate();

  return (
    <>
      <DataTableToolbar label="Payment actions">
        <ExportCsvButton filename="payments.csv" columns={paymentIntentColumns} rows={rows} />
      </DataTableToolbar>

      <DataTable<PaymentIntentRow>
        caption="Payment intents, newest first"
        columns={paymentIntentColumns}
        rows={rows}
        isLoading={isLoading}
        onRowClick={(row) => navigate(ROUTES.payments.detail(row.id))}
        emptyState={
          <EmptyRows
            title="No payments yet"
            body="Payments appear here as soon as your integration creates its first payment intent."
          />
        }
      />

      <DataTablePagination
        hasMore={hasMore}
