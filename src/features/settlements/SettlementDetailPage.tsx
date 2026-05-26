/**
 * `SettlementDetailPage` — child route of `SettlementsPage`, at
 * `ROUTES.settlements.detail(batchId)`. Renamed from `SettlementBatchPage.tsx` in the
 * PAY-2043 PR.
 *
 * Frame 2 of the canonical chain. It mounts both arc-INC components:
 * `<BatchTotalsPanel/>` (posted vs expected) and, through the item columns,
 * `<DuplicateBadge/>`.
 */
import { useParams } from 'react-router-dom';

import type { ReconciliationItemStatus } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Badge } from '@components/ui/Badge';
import { DateCell } from '@components/data/DateCell';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useQueryParamState } from '@hooks/useQueryParamState';

import { BatchTotalsPanel } from './components/BatchTotalsPanel';
import { SettlementItemTable } from './components/SettlementItemTable';
import { useSettlement } from './useSettlement';
import { useSettlementItems } from './useSettlementItems';

export function SettlementDetailPage() {
  const { batchId = '' } = useParams<{ batchId: string }>();
  useDocumentTitle(batchId ? `Settlement ${batchId}` : 'Settlement');

  const [status, setStatus] = useQueryParamState<ReconciliationItemStatus | 'all'>(
    'item_status',
    'all',
  );

  const { batch, isLoading, isMissing, error } = useSettlement(batchId);
  const items = useSettlementItems(batchId, status === 'all' ? undefined : { status });

  if (isMissing) {
    return <NotFound title="No such settlement batch" body="You have no items in this batch." />;
  }
  if (isLoading || !batch) {
    return <LoadingPage label="Loading settlement batch" />;
  }
  if (error) {
    return <ErrorState error={error} title="We could not load this batch" />;
  }

  return (
    <PageContainer as="main">
      <PageHeader
        title={`Settlement ${batch.id}`}
        description={`${batch.acquirer} · processing date ${batch.processing_date}`}
        isBusy={items.isFetching}
      >
        <Badge tone={batch.status === 'failed' ? 'critical' : 'neutral'}>
          {batch.status.replace(/_/g, ' ')}
        </Badge>
        {batch.funded_at ? (
          <span>
