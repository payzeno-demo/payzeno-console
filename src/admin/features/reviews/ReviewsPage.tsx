/**
 * `ReviewsPage` — `/reviews`, the risk review queue (RFC platform-v2 §8).
 *
 * Payments a platform rule held for a person: authorised, not captured, the shopper waiting.
 * The open queue is the default view, oldest first. Open a row to see the signals and decide.
 */
import { REVIEW_STATUSES } from '@payzeno/contracts';
import type { Review, ReviewStatus } from '@payzeno/contracts';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import { FilterBar } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Select } from '@components/ui/Select';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useQueryParamState } from '@hooks/useQueryParamState';
import { labelise } from '@lib/format';

import { ADMIN_ROUTES } from '../../adminRoutes';
import { AdminQueryError } from '../../components/AdminQueryError';

import { reviewColumns } from './reviews.columns';
import { useReviews } from './useReviews';

type StatusFilter = ReviewStatus | 'all';
const FILTERS: ReadonlyArray<StatusFilter> = [...REVIEW_STATUSES, 'all'];

const parseFilter = (raw: string): StatusFilter | null =>
  FILTERS.includes(raw as StatusFilter) ? (raw as StatusFilter) : null;
const serialiseFilter = (value: StatusFilter): string | null => (value === 'open' ? null : value);

export function ReviewsPage() {
  useDocumentTitle('Risk reviews', 'Admin');
  const navigate = useNavigate();

  const [filter, setFilter] = useQueryParamState<StatusFilter>('status', {
    parse: parseFilter,
    serialise: serialiseFilter,
    fallback: 'open',
  });

  const { rows, pagination, isLoading, isFetching, error, refetch } = useReviews(
    filter === 'all' ? {} : { status: filter },
  );

  return (
    <PageContainer as="main" width="wide">
      <PageHeader
        title="Risk reviews"
        description="Payments held by a platform risk rule. Approving captures the payment; declining voids the authorisation and the shopper is never charged."
        isBusy={isFetching && !isLoading}
      />

      <FilterBar
        label="Review filters"
        activeCount={filter === 'open' ? 0 : 1}
        onClear={() => setFilter('open')}
      >
        <Select
          id="review-status"
          label="Status"
          value={filter}
          onValueChange={(next) => setFilter(next)}
          options={FILTERS.map((value) => ({
            value,
            label: value === 'all' ? 'All reviews' : value === 'open' ? 'Open — needs a decision' : labelise(value),
          }))}
        />
      </FilterBar>

      {error ? (
        <AdminQueryError error={error} title="We could not load the review queue" what="risk reviews" onRetry={refetch} />
      ) : (
        <>
          <DataTable<Review>
            caption={filter === 'open' ? 'Open risk reviews, oldest first' : 'Risk reviews'}
            columns={reviewColumns}
            rows={rows}
            isLoading={isLoading}
            onRowClick={(row) => navigate(ADMIN_ROUTES.reviews.detail(row.id))}
            emptyState={
              <EmptyRows
                title={filter === 'open' ? 'The queue is empty' : 'No reviews'}
                body={
                  filter === 'open'
                    ? 'No payments are waiting for a risk decision.'
                    : 'No reviews match this filter.'
                }
              />
            }
          />
          <DataTablePagination
            pageNumber={pagination.pageNumber}
            canGoBack={pagination.canGoBack}
            canGoForward={pagination.canGoForward}
            onPrevious={pagination.goBack}
            onNext={pagination.goNext}
            rowsOnPage={rows.length}
            resourceLabel="reviews"
          />
        </>
      )}
    </PageContainer>
  );
}
