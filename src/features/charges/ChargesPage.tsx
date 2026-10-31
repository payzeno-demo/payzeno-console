import type { ChargeStatus } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { FilterBar } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Select } from '@components/ui/Select';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam, useStringParam } from '@hooks/useQueryParamState';

import { ChargeTable } from './components/ChargeTable';
import { useCharges } from './useCharges';

const STATUS_OPTIONS: ReadonlyArray<ChargeStatus | 'all'> = [
  'all',
  'pending',
  'authorized',
  'captured',
  'settled',
  'failed',
  'voided',
  'expired',
  'reversed',
];

export function ChargesPage() {
  useDocumentTitle('Charges');

  const [statusParam, setStatus] = useEnumParam('status', STATUS_OPTIONS, 'all');
  const status = statusParam ?? 'all';
  const [cursor, setCursor] = useStringParam('cursor');

  const { rows, isLoading, isFetching, hasMore, nextCursor, error } = useCharges({
    ...(status === 'all' ? {} : { status }),
    ...(cursor ? { cursor } : {}),
  });

  return (
    <PageContainer as="main">
      <PageHeader
        title="Charges"
        description="An authorised or captured payment, as your acquirer sees it."
        isBusy={isFetching}
      />

      <FilterBar label="Charge filters">
        <Select
          id="charge-status"
          label="Status"
          value={status}
          onValueChange={(next) => {
            setStatus(next as ChargeStatus | 'all');
            setCursor('');
          }}
          options={STATUS_OPTIONS.map((value) => ({
            value,
            label: value === 'all' ? 'All statuses' : value,
          }))}
        />
      </FilterBar>

      {error ? (
        <ErrorState error={error} title="We could not load your charges" />
      ) : (
        <ChargeTable
          rows={rows}
          isLoading={isLoading}
          hasMore={hasMore}
          nextCursor={nextCursor}
          onCursorChange={(next) => setCursor(next ?? '')}
        />
      )}
    </PageContainer>
  );
}
