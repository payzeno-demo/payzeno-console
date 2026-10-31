/**
 * `PaymentsPage` — the payments index route. `PaymentIntentDetailPage` is its child.
 *
 * Two views, one URL parameter (`?view=reviews`): every payment intent, or the payments
 * Payzeno risk is holding for review (RFC platform-v2 §8, `GET /v1/reviews`). The reviews view
 * is read-only — a merchant watches a review, Payzeno staff decide it.
 */
import { REVIEW_STATUSES } from '@payzeno/contracts';
import type { PaymentIntentStatus, ReviewStatus } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { FilterBar } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Input } from '@components/ui/Input';
import { Label } from '@components/ui/Label';
import { SegmentedControl } from '@components/ui/SegmentedControl';
import { Select } from '@components/ui/Select';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam, useStringParam } from '@hooks/useQueryParamState';

import { PaymentIntentTable } from './components/PaymentIntentTable';
import { ReviewTable } from './components/ReviewTable';
import { REVIEW_STATUS_LABELS } from './risk';
import { usePaymentIntents } from './usePaymentIntents';
import { useReviews } from './useReviews';

const VIEWS = ['payments', 'reviews'] as const;
type PaymentsView = (typeof VIEWS)[number];

const STATUS_OPTIONS: ReadonlyArray<PaymentIntentStatus | 'all'> = [
  'all',
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'requires_capture',
  'processing',
  'succeeded',
  'failed',
  'canceled',
];

export function PaymentsPage() {
  useDocumentTitle('Payments');

  const [statusParam, setStatus] = useEnumParam('status', STATUS_OPTIONS, 'all');
  const status = statusParam ?? 'all';
  const [customer, setCustomer] = useStringParam('customer');
  // Every filter setter drops `cursor` itself (`useQueryParamState`). A second `setCursor('')`
  // in the same handler used to undo the filter change: react-router's functional
  // `setSearchParams` reads the params from the last render, so the later call won.
  const [cursor, setCursor] = useStringParam('cursor');
  const [viewParam, setView] = useEnumParam<PaymentsView>('view', VIEWS, 'payments');
  const view = viewParam ?? 'payments';
  const [reviewStatusParam, setReviewStatus] = useEnumParam<ReviewStatus | 'all'>(
    'review_status',
    ['all', ...REVIEW_STATUSES],
    'open',
  );
  const reviewStatus = reviewStatusParam ?? 'open';

  // Typing a customer reference should not fire one request per keystroke.
  const debouncedCustomer = useDebouncedValue(customer, 300);

  const { rows, isLoading, isFetching, hasMore, nextCursor, error } = usePaymentIntents(
    {
      ...(status === 'all' ? {} : { status }),
      ...(debouncedCustomer ? { customer_reference: debouncedCustomer } : {}),
      ...(cursor ? { cursor } : {}),
    },
    { enabled: view === 'payments' },
  );

  const reviews = useReviews(
    {
      ...(reviewStatus === 'all' ? {} : { status: reviewStatus }),
      ...(cursor ? { cursor } : {}),
    },
    { enabled: view === 'reviews' },
  );

  return (
    <PageContainer as="main">
      <PageHeader
        title="Payments"
        description="Every payment intent your integration has created."
        isBusy={view === 'payments' ? isFetching : reviews.isFetching}
      />

      <SegmentedControl<PaymentsView>
        label="Payments view"
        value={view}
        onValueChange={(next) => {
          setView(next);
        }}
        segments={[
          { value: 'payments', label: 'All payments' },
          { value: 'reviews', label: 'Reviews' },
        ]}
      />

      {view === 'reviews' ? (
        <>
          <FilterBar label="Review filters">
            <Select
              id="review-status"
              label="Review status"
              value={reviewStatus}
              onValueChange={(next) => {
                setReviewStatus(next as ReviewStatus | 'all');
              }}
              options={[
                { value: 'all', label: 'All reviews' },
                ...REVIEW_STATUSES.map((value) => ({ value, label: REVIEW_STATUS_LABELS[value] })),
              ]}
            />
          </FilterBar>

          {reviews.error ? (
            <ErrorState error={reviews.error} title="We could not load your reviews" />
          ) : (
            <ReviewTable
              rows={reviews.rows}
              isLoading={reviews.isLoading}
              hasMore={reviews.hasMore}
              nextCursor={reviews.nextCursor}
              onCursorChange={(next) => setCursor(next ?? '')}
            />
          )}
        </>
      ) : null}

      {view === 'payments' ? (
        <>
          <FilterBar label="Payment filters">
            <Select
              id="payment-status"
              label="Status"
              value={status}
              onValueChange={(next) => {
                setStatus(next as PaymentIntentStatus | 'all');
              }}
              options={STATUS_OPTIONS.map((value) => ({
                value,
                label: value === 'all' ? 'All statuses' : value.replace(/_/g, ' '),
              }))}
            />
            <Label htmlFor="payment-customer">Customer reference</Label>
            <Input
              id="payment-customer"
              value={customer}
              placeholder="cust-1024"
              onChange={(event) => {
                setCustomer(event.target.value);
              }}
            />
          </FilterBar>

          {error ? (
            <ErrorState error={error} title="We could not load your payments" />
          ) : (
            <PaymentIntentTable
              rows={rows}
              isLoading={isLoading}
              hasMore={hasMore}
              nextCursor={nextCursor}
              onCursorChange={(next) => setCursor(next ?? '')}
            />
          )}
        </>
      ) : null}
    </PageContainer>
  );
}
