import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import { ROUTES } from '@/routes';
import type { ReviewRow } from '@/types/view-models';

import { reviewColumns } from '../reviews.columns';

export interface ReviewTableProps {
  rows: ReadonlyArray<ReviewRow>;
  isLoading: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  onCursorChange: (cursor: string | null) => void;
}

/** Read-only. Payzeno risk decides reviews in the admin back office, never from here. */
export function ReviewTable({
  rows,
  isLoading,
  hasMore,
  nextCursor,
  onCursorChange,
}: ReviewTableProps) {
  const navigate = useNavigate();

  return (
    <>
      <DataTable<ReviewRow>
        caption="Payments held for review by Payzeno risk, newest first"
        columns={reviewColumns}
        rows={rows}
        isLoading={isLoading}
        onRowClick={(row) => navigate(ROUTES.payments.detail(row.payment_intent_id))}
        emptyState={
          <EmptyRows
            title="Nothing held for review"
            body="When Payzeno's risk rules hold a payment for a closer look, it appears here until a decision is made."
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
