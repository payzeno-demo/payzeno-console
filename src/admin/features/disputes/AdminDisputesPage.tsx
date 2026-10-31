/**
 * `AdminDisputesPage` — `/disputes`. Chargebacks across every merchant, filterable by status,
 * with "Accept" to concede one on the merchant's behalf (`risk`, from `needs_response` only).
 *
 * The status filter is in the URL; the home page's tile links to `?status=needs_response`.
 */
import { DISPUTE_STATUSES } from '@payzeno/contracts';
import type { Dispute, DisputeStatus } from '@payzeno/contracts';
import { useMemo, useState } from 'react';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import { FilterBar } from '@components/data/FilterBar';
import { MoneyCell } from '@components/data/MoneyCell';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Select } from '@components/ui/Select';
import { font } from '@components/ui/tokens';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam } from '@hooks/useQueryParamState';
import { labelise } from '@lib/format';

import { useStaffPermissions } from '../../app/StaffSessionContext';
import { ActionOutcomeAlert } from '../../components/ActionOutcome';
import { AdminQueryError } from '../../components/AdminQueryError';
import { ConfirmActionDialog } from '../../components/ConfirmActionDialog';

import { adminDisputeColumns } from './admin-disputes.columns';
import { useAcceptDispute } from './useAcceptDispute';
import { useAdminDisputes } from './useAdminDisputes';

export function AdminDisputesPage() {
  useDocumentTitle('Disputes', 'Admin');

  const [status, setStatus] = useEnumParam<DisputeStatus>('status', DISPUTE_STATUSES);
  const { rows, pagination, isLoading, isFetching, error, refetch } = useAdminDisputes(
    status ? { status } : {},
  );
  const accept = useAcceptDispute();
  const { can } = useStaffPermissions();
  const [target, setTarget] = useState<Dispute | null>(null);

  const columns = useMemo(
    () => adminDisputeColumns({ canAccept: can('disputes:accept'), onAccept: setTarget }),
    [can],
  );

  const close = () => {
    setTarget(null);
    accept.reset();
  };

  return (
    <PageContainer as="main" width="wide">
      <PageHeader
        title="Disputes"
        description="Chargebacks across every merchant. Accepting concedes the dispute on the merchant's behalf — the money stays with the cardholder."
        isBusy={isFetching && !isLoading}
      />

      <ActionOutcomeAlert outcome={accept.outcome} onDismiss={accept.clearOutcome} />

      <FilterBar label="Dispute filters" activeCount={status ? 1 : 0} onClear={() => setStatus(null)}>
        <Select
          id="admin-dispute-status"
          label="Status"
          value={status ?? ''}
          onValueChange={(next) => setStatus(next === '' ? null : (next as DisputeStatus))}
          options={[
            { value: '', label: 'All statuses' },
            ...DISPUTE_STATUSES.map((value) => ({ value, label: labelise(value) })),
          ]}
        />
      </FilterBar>

      {error ? (
        <AdminQueryError error={error} title="We could not load disputes" what="disputes" onRetry={refetch} />
      ) : (
        <>
          <DataTable<Dispute>
            caption={status ? `Disputes with status ${labelise(status)}` : 'Disputes across all merchants'}
            columns={columns}
            rows={rows}
            isLoading={isLoading}
            emptyState={<EmptyRows title="No disputes" body="No dispute matches this filter." />}
          />
          <DataTablePagination
            pageNumber={pagination.pageNumber}
            canGoBack={pagination.canGoBack}
            canGoForward={pagination.canGoForward}
            onPrevious={pagination.goBack}
            onNext={pagination.goNext}
            rowsOnPage={rows.length}
            resourceLabel="disputes"
          />
        </>
      )}

      <ConfirmActionDialog
        open={target !== null}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title={target ? `Accept dispute ${target.id}?` : 'Accept dispute?'}
        description="This concedes the chargeback on the merchant's behalf. The dispute closes as lost, and the amount and the dispute fee are not recoverable. The merchant cannot submit evidence afterwards."
        confirmLabel="Accept dispute"
        confirmVariant="danger"
        isPending={accept.isPending}
        errorMessage={accept.errorMessage}
        onConfirm={() => {
          if (target) {
            accept.run({ disputeId: target.id, merchantId: target.merchant_id }, { onSuccess: close });
          }
        }}
      >
        {target ? (
          <p style={{ margin: 0, fontSize: font.size.md }}>
            <MoneyCell amountMinor={target.amount_minor} currency={target.currency} /> ·{' '}
            {labelise(target.reason)} · merchant {target.merchant_id}
          </p>
        ) : null}
      </ConfirmActionDialog>
    </PageContainer>
  );
}
