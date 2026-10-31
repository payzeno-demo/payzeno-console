import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import { ROUTES } from '@/routes';
import type { SubscriptionRow } from '@/types/view-models';

import { subscriptionColumns } from '../subscriptions.columns';

export interface SubscriptionTableProps {
  rows: ReadonlyArray<SubscriptionRow>;
  isLoading: boolean;
  caption?: string;
  /** Omit on the customer page, which shows one page and no pager. */
  pagination?: {
    hasMore: boolean;
    nextCursor: string | null;
    onCursorChange: (cursor: string | null) => void;
  };
}

export function SubscriptionTable({
  rows,
  isLoading,
  caption = 'Subscriptions, newest first',
  pagination,
}: SubscriptionTableProps) {
  const navigate = useNavigate();

  return (
    <>
      <DataTable<SubscriptionRow>
        caption={caption}
        columns={subscriptionColumns}
        rows={rows}
        isLoading={isLoading}
        onRowClick={(row) => navigate(ROUTES.billing.subscription(row.id))}
        emptyState={
          <EmptyRows
            title="No subscriptions"
            body="Subscriptions start when a customer completes a checkout for a recurring price."
          />
        }
      />
      {pagination ? (
        <DataTablePagination
          hasMore={pagination.hasMore}
          onNext={() => pagination.onCursorChange(pagination.nextCursor)}
          onReset={() => pagination.onCursorChange(null)}
          isBusy={isLoading}
        />
      ) : null}
    </>
  );
}
