/**
 * The payouts list table. Presentational.
 *
 * a11y: the caption says what the ordering is, and the in-flight accent is an attribute plus
 * the status text — never colour alone.
 */
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import type { Pagination } from '@hooks/usePagination';
import { ROUTES } from '@/routes';
import type { PayoutRow } from '@/types/view-models';

import { IN_FLIGHT_STATUSES, payoutColumns } from '../payouts.columns';

/** How many of these rows still have money in motion. Rendered above the pagination row. */
function inFlightCount(rows: ReadonlyArray<PayoutRow>): number {
  return rows.filter((row) => IN_FLIGHT_STATUSES.has(row.status)).length;
}

export interface PayoutTableProps {
  rows: ReadonlyArray<PayoutRow>;
  isLoading: boolean;
  pagination?: Pagination;
}

export function PayoutTable({ rows, isLoading, pagination }: PayoutTableProps) {
  const navigate = useNavigate();

  return (
    <>
      <DataTable<PayoutRow>
        caption="Payouts, most recently scheduled first"
        columns={payoutColumns}
        rows={rows}
        isLoading={isLoading}
        onRowClick={(row) => navigate(ROUTES.payouts.detail(row.id))}
        emptyState={
          <EmptyRows
            title="No payouts yet"
            body="Payouts appear here once your balance clears and your schedule fires."
          />
        }
      />
      {inFlightCount(rows) > 0 ? (
        <p role="status">{inFlightCount(rows)} of these are still on their way to your bank.</p>
      ) : null}
      {pagination ? (
        <DataTablePagination
          pageNumber={pagination.pageNumber}
          canGoBack={pagination.canGoBack}
          canGoForward={pagination.canGoForward}
          onPrevious={pagination.goBack}
          onNext={pagination.goNext}
          resourceLabel="payouts"
        />
      ) : null}
    </>
  );
}
