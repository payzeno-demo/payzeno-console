/**
 * `SubscriptionsPage` — Billing → Subscriptions, `/billing/subscriptions` (RFC platform-v2 §6).
 *
 * Calls: `GET /v1/subscriptions?status=`, `GET /v1/prices` (product names).
 */
import { SUBSCRIPTION_STATUSES } from '@payzeno/contracts';
import type { SubscriptionStatus } from '@payzeno/contracts';

import { FilterBar } from '@components/data/FilterBar';
import { ErrorState } from '@components/feedback/ErrorState';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Select } from '@components/ui/Select';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam, useStringParam } from '@hooks/useQueryParamState';
import { pluralise } from '@lib/format';

import { SUBSCRIPTION_STATUS_LABELS } from './billing.format';
import { BillingTabs } from './components/BillingTabs';
import { SubscriptionTable } from './components/SubscriptionTable';
import { useSubscriptions } from './useSubscriptions';

export function SubscriptionsPage() {
  useDocumentTitle('Subscriptions');

  const [status, setStatus] = useEnumParam<SubscriptionStatus>('status', SUBSCRIPTION_STATUSES);
  const [cursor, setCursor] = useStringParam('cursor');

  const { rows, isLoading, isFetching, hasMore, nextCursor, error } = useSubscriptions({
    ...(status ? { status } : {}),
    ...(cursor ? { cursor } : {}),
  });
  const pastDue = rows.filter((row) => row.status === 'past_due').length;

  return (
    <PageContainer as="main">
      <PageHeader
        title="Subscriptions"
        description="Your customers' recurring plans, renewed automatically on their saved card."
        isBusy={isFetching}
      />

      <BillingTabs />

      {pastDue > 0 && status !== 'past_due' ? (
        <Alert tone="warning" title="Renewals are failing" role="status">
          {pluralise(pastDue, 'subscription')} on this page could not be renewed. Payzeno retries
          automatically and has emailed each customer a link to update their card.
        </Alert>
      ) : null}

      <FilterBar label="Subscription filters">
        <Select
          id="subscription-status"
          label="Status"
          value={status ?? ''}
          onValueChange={(next) => {
            setStatus(next === '' ? null : (next as SubscriptionStatus));
          }}
          options={[
            { value: '', label: 'All statuses' },
            ...SUBSCRIPTION_STATUSES.map((value) => ({
              value,
              label: SUBSCRIPTION_STATUS_LABELS[value],
            })),
          ]}
        />
      </FilterBar>

      {error ? (
        <ErrorState error={error} title="We could not load your subscriptions" />
      ) : (
        <SubscriptionTable
          rows={rows}
          isLoading={isLoading}
          pagination={{ hasMore, nextCursor, onCursorChange: (next) => setCursor(next ?? '') }}
        />
      )}
    </PageContainer>
  );
}
