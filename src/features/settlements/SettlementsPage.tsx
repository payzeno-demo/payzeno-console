/**
 * `SettlementsPage` — the settlements index route (`ROUTES.settlements.index`).
 * `SettlementDetailPage` is registered as its child in `src/router.tsx`.
 *
 * Layout plus section components only. The one hook it calls is `useSettlements`.
 */
import type { CurrencyCode, SettlementBatchStatus } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { FilterBar } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { CurrencySelect } from '@components/form/CurrencySelect';
import { Select } from '@components/ui/Select';
import { useCurrentMerchant } from '@app/SessionContext';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useQueryParamState } from '@hooks/useQueryParamState';

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
  const [status, setStatus] = useQueryParamState<SettlementBatchStatus | 'all'>('status', 'all');
  const [currency, setCurrency] = useQueryParamState<CurrencyCode>(
    'currency',
    merchant.default_currency,
  );

  const { rows, isLoading, isFetching, error } = useSettlements({
    currency,
    ...(status === 'all' ? {} : { status }),
  });

  return (
    <PageContainer as="main">
      <PageHeader
        title="Settlements"
