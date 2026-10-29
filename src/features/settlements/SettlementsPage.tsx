/**
 * `SettlementsPage` — the settlements index route (`ROUTES.settlements.index`).
 * `SettlementDetailPage` is registered as its child in `src/router.tsx`.
 *
 * Layout plus section components only. The one hook it calls is `useSettlements`.
 */
import { CURRENCIES } from '@payzeno/contracts';
import type { SettlementBatchStatus } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { FilterBar } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { CurrencySelect } from '@components/form/CurrencySelect';
import { Select } from '@components/ui/Select';
import { useCurrentMerchant } from '@app/SessionContext';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam } from '@hooks/useQueryParamState';

import { SettlementTable } from './components/SettlementTable';
import { useSettlements } from './useSettlements';

const STATUS_OPTIONS: ReadonlyArray<SettlementBatchStatus | 'all'> = [
  'all',
  'open',
  'closed',
  'reconciling',
  'reconciled',
  'partially_reconciled',
  'funded',
  'failed',
];

export function SettlementsPage() {
  useDocumentTitle('Settlements');

  const merchant = useCurrentMerchant();
  const [statusParam, setStatus] = useEnumParam('status', STATUS_OPTIONS, 'all');
  const status = statusParam ?? 'all';
  const [currencyParam, setCurrency] = useEnumParam(
    'currency',
    CURRENCIES,
    merchant.default_currency,
  );
  const currency = currencyParam ?? merchant.default_currency;

  const { rows, isLoading, isFetching, error } = useSettlements({
    currency,
    ...(status === 'all' ? {} : { status }),
  });

  return (
    <PageContainer as="main">
      <PageHeader
        title="Settlements"
        description="Each batch is one acquirer settlement file, filtered to your items."
        isBusy={isFetching}
      />

      <FilterBar label="Settlement filters">
        <CurrencySelect id="settlement-currency" value={currency} onChange={setCurrency} />
        <Select
          id="settlement-status"
          label="Status"
          value={status}
          onValueChange={(next) => setStatus(next as SettlementBatchStatus | 'all')}
          options={STATUS_OPTIONS.map((value) => ({
            value,
            label: value === 'all' ? 'All statuses' : value.replace(/_/g, ' '),
          }))}
        />
      </FilterBar>

      {error ? (
        <ErrorState error={error} title="We could not load your settlements" />
      ) : (
        <SettlementTable rows={rows} isLoading={isLoading} />
      )}
    </PageContainer>
  );
}
