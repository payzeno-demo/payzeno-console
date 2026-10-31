/**
 * The disputes list table.
 *
 * a11y: rows are navigable, and the urgency accent is carried by a `data-urgent` attribute on
 * the cell plus the text "36h left" — never by colour alone. Tal rejected the first version
 * of this for exactly that.
 */
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import type { Pagination } from '@hooks/usePagination';
import { ROUTES } from '@/routes';
import type { DisputeRow } from '@/types/view-models';

import { disputeColumns } from '../disputes.columns';

export interface DisputeTableProps {
  rows: ReadonlyArray<DisputeRow>;
  isLoading: boolean;
  pagination?: Pagination;
}

export function DisputeTable({ rows, isLoading, pagination }: DisputeTableProps) {
  const navigate = useNavigate();

  return (
    <>
      <DataTable<DisputeRow>
        caption="Disputes, soonest response deadline first"
        columns={disputeColumns}
        rows={rows}
        isLoading={isLoading}
        onRowClick={(row) => navigate(ROUTES.disputes.detail(row.id))}
        emptyState={
          <EmptyRows
            title="No disputes"
            body="Chargebacks raised by an issuer appear here, with the deadline to respond."
          />
        }
      />
      {pagination ? (
        <DataTablePagination
          pageNumber={pagination.pageNumber}
          canGoBack={pagination.canGoBack}
          canGoForward={pagination.canGoForward}
          onPrevious={pagination.goBack}
          onNext={pagination.goNext}
          resourceLabel="disputes"
        />
      ) : null}
    </>
  );
}
