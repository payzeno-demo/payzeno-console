/**
 * `DisputesPage` — the disputes index route. `DisputeDetailPage` is its child.
 *
 * The urgency banner is the reason merchants open this page at all, so it renders above the
 * filters and is a live region: a dispute that lands while the tab is open (via the
 * `dispute.opened` notification, which invalidates this query) announces itself.
 */
import { DISPUTE_STATUSES } from '@payzeno/contracts';
import type { DisputeStatus } from '@payzeno/contracts';

import { ExportCsvButton } from '@components/data/ExportCsvButton';
import { FilterBar } from '@components/data/FilterBar';
import { ErrorState } from '@components/feedback/ErrorState';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Select } from '@components/ui/Select';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam } from '@hooks/useQueryParamState';
import { humanise, pluralise } from '@lib/format';

import { DisputeTable } from './components/DisputeTable';
import { disputeColumns } from './disputes.columns';
import { EVIDENCE_URGENT_HOURS, useDisputes } from './useDisputes';

export function DisputesPage() {
  useDocumentTitle('Disputes');

  const [status, setStatus] = useEnumParam<DisputeStatus>('status', DISPUTE_STATUSES);
  const { rows, urgentCount, pagination, isLoading, isFetching, error } = useDisputes({
    ...(status ? { status } : {}),
  });

  return (
    <PageContainer as="main">
      <PageHeader
        title="Disputes"
        description="Chargebacks raised against your charges, and the clock on each."
        isBusy={isFetching}
      >
        <ExportCsvButton rows={rows} columns={disputeColumns} resource="disputes" />
      </PageHeader>

      {urgentCount > 0 ? (
        <Alert tone="critical" title="Evidence due soon" role="status">
          {pluralise(urgentCount, 'dispute')} need a response within {EVIDENCE_URGENT_HOURS} hours.
          After the deadline the network decides without you.
