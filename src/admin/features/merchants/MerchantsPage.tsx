/**
 * `MerchantsPage` — `/merchants`. Every merchant on the platform, filterable by status and by
 * onboarding state, searchable by name, id or owner email. Every staff role can read it.
 *
 * Filters live in the URL (`?status=&onboarding_state=&q=`) so "the KYC queue" is a link:
 * the home page's pending-KYC tile points at `?onboarding_state=submitted`.
 */
import { MERCHANT_STATUSES, ONBOARDING_STATES } from '@payzeno/contracts';
import type { MerchantStatus, OnboardingState } from '@payzeno/contracts';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import { FilterBar, FilterField } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { space } from '@components/ui/tokens';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam, useStringParam } from '@hooks/useQueryParamState';
import { labelise } from '@lib/format';

import { ADMIN_ROUTES } from '../../adminRoutes';
import { AdminQueryError } from '../../components/AdminQueryError';
import type { AdminMerchantRow } from '../../types/admin-views';

import { merchantColumns } from './merchants.columns';
import { useAdminMerchants } from './useAdminMerchants';

export function MerchantsPage() {
  useDocumentTitle('Merchants', 'Admin');
  const navigate = useNavigate();

  const [status, setStatus] = useEnumParam<MerchantStatus>('status', MERCHANT_STATUSES);
  const [onboarding, setOnboarding] = useEnumParam<OnboardingState>(
    'onboarding_state',
    ONBOARDING_STATES,
  );
  const [q, setQ] = useStringParam('q');

  // The box is local until submitted, so a half-typed name does not fire a request per key.
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const { rows, pagination, isLoading, isFetching, error, refetch } = useAdminMerchants({
    ...(status ? { status } : {}),
    ...(onboarding ? { onboarding_state: onboarding } : {}),
    ...(q ? { q } : {}),
  });

  const activeCount = [status, onboarding, q].filter(Boolean).length;

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQ(search.trim());
  };

  return (
    <PageContainer as="main" width="wide">
      <PageHeader
        title="Merchants"
        description="Every merchant on Payzeno. Open one to review its onboarding application, documents, users and status."
        isBusy={isFetching && !isLoading}
      />

      <FilterBar
        label="Merchant filters"
        activeCount={activeCount}
        onClear={() => {
          setStatus(null);
          setOnboarding(null);
          setQ('');
        }}
      >
        <form onSubmit={submitSearch} style={{ display: 'flex', alignItems: 'flex-end', gap: space[2] }}>
          <FilterField id="merchant-search" label="Search">
            <Input
              id="merchant-search"
              type="search"
              placeholder="Name, merchant id or owner email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </FilterField>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <Select
          id="merchant-status"
          label="Status"
          value={status ?? ''}
          onValueChange={(next) => setStatus(next === '' ? null : (next as MerchantStatus))}
          options={[
            { value: '', label: 'All statuses' },
            ...MERCHANT_STATUSES.map((value) => ({ value, label: labelise(value) })),
          ]}
        />

        <Select
          id="merchant-onboarding"
          label="Onboarding"
          value={onboarding ?? ''}
          onValueChange={(next) => setOnboarding(next === '' ? null : (next as OnboardingState))}
          options={[
            { value: '', label: 'All onboarding states' },
            ...ONBOARDING_STATES.map((value) => ({ value, label: labelise(value) })),
          ]}
        />
      </FilterBar>

      {error ? (
        <AdminQueryError error={error} title="We could not load merchants" what="merchants" onRetry={refetch} />
      ) : (
        <>
          <DataTable<AdminMerchantRow>
            caption={
              onboarding === 'submitted'
                ? 'Merchants waiting for a KYC decision'
                : 'Merchants, filtered by the controls above'
            }
            columns={merchantColumns}
            rows={rows}
            isLoading={isLoading}
            onRowClick={(row) => navigate(ADMIN_ROUTES.merchants.detail(row.id))}
            emptyState={
              <EmptyRows
                title="No merchants match"
                body="Clear a filter or search for a different name, id or email."
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
            resourceLabel="merchants"
          />
        </>
      )}
    </PageContainer>
  );
}
