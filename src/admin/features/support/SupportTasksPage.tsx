/**
 * `SupportTasksPage` — `/support` (support). The tasks the platform opened for a person —
 * duplicate settlements, ledger imbalances, returned payouts, dunning escalations — with
 * "Resolve" and a resolution note. Open tasks are the default view.
 */
import { SUPPORT_TASK_STATUSES } from '@payzeno/contracts';
import type { SupportTask, SupportTaskStatus } from '@payzeno/contracts';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { ColumnDef } from '@components/data/column.types';
import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { DateCell, dateExportValue } from '@components/data/DateCell';
import { EmptyRows } from '@components/data/EmptyRows';
import { FilterBar } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { color, font } from '@components/ui/tokens';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useQueryParamState } from '@hooks/useQueryParamState';
import { labelise } from '@lib/format';

import { ADMIN_ROUTES } from '../../adminRoutes';
import { ACTION_ROLES, describeRequirement } from '../../app/staff-roles';
import { useStaffPermissions } from '../../app/StaffSessionContext';
import { ActionOutcomeAlert } from '../../components/ActionOutcome';
import { AdminQueryError } from '../../components/AdminQueryError';
import { AdminStatusPill } from '../../components/AdminStatusPill';
import { ConfirmActionDialog } from '../../components/ConfirmActionDialog';
import { isOpenSupportTask } from '../../types/support-task';

import { useResolveSupportTask } from './useResolveSupportTask';
import { useSupportTasks } from './useSupportTasks';

type StatusFilter = SupportTaskStatus | 'all';
const FILTERS: ReadonlyArray<StatusFilter> = [...SUPPORT_TASK_STATUSES, 'all'];
const parseFilter = (raw: string): StatusFilter | null =>
  FILTERS.includes(raw as StatusFilter) ? (raw as StatusFilter) : null;
const serialiseFilter = (value: StatusFilter): string | null => (value === 'open' ? null : value);

export function SupportTasksPage() {
  useDocumentTitle('Support tasks', 'Admin');

  const [filter, setFilter] = useQueryParamState<StatusFilter>('status', {
    parse: parseFilter,
    serialise: serialiseFilter,
    fallback: 'open',
  });
  const { rows, pagination, isLoading, isFetching, error, refetch } = useSupportTasks(
    filter === 'all' ? {} : { status: filter },
  );
  const resolve = useResolveSupportTask();
  const { can } = useStaffPermissions();
  const canResolve = can('support:resolve');
  const [target, setTarget] = useState<SupportTask | null>(null);

  const close = () => {
    setTarget(null);
    resolve.reset();
  };

  const columns = useMemo<ReadonlyArray<ColumnDef<SupportTask>>>(
    () => [
      {
        id: 'severity',
        header: 'Severity',
        sortable: true,
        exportValue: (row) => String(['low', 'normal', 'high', 'critical'].indexOf(row.severity)),
        cell: (row) => <AdminStatusPill kind="severity" status={row.severity} size="sm" />,
      },
      {
        id: 'title',
        header: 'Task',
        exportValue: (row) => row.title,
        cell: (row) => (
          <span style={{ display: 'inline-grid' }}>
            <span>{row.title}</span>
            <span style={{ fontSize: font.size.sm, color: color.textSecondary }}>
              {labelise(row.kind)} · <code>{row.id}</code>
            </span>
          </span>
        ),
      },
      {
        id: 'merchant',
        header: 'Merchant',
        exportValue: (row) => row.merchant_id,
        cell: (row) => (
          <Link to={ADMIN_ROUTES.merchants.detail(row.merchant_id)} style={{ color: color.textLink }}>
            {row.merchant_id}
          </Link>
        ),
      },
      {
        id: 'charge',
        header: 'Charge',
        exportValue: (row) => row.charge_id ?? '',
        cell: (row) => (row.charge_id ? <code>{row.charge_id}</code> : '—'),
      },
      {
        id: 'status',
        header: 'Status',
        exportValue: (row) => row.status,
        cell: (row) => <AdminStatusPill kind="support" status={row.status} size="sm" />,
      },
      {
        id: 'created',
        header: 'Opened',
        sortable: true,
        exportValue: (row) => dateExportValue(row.created_at),
        cell: (row) => <DateCell value={row.created_at} />,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: (row) =>
          isOpenSupportTask(row) ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={!canResolve}
              title={canResolve ? undefined : `Needs ${describeRequirement(ACTION_ROLES['support:resolve'])}.`}
              aria-label={`Resolve task: ${row.title}`}
              onClick={() => setTarget(row)}
            >
              Resolve
            </Button>
          ) : (
            <span style={{ color: color.textMuted }}>{row.resolution_note ?? '—'}</span>
          ),
      },
    ],
    [canResolve],
  );

  return (
    <PageContainer as="main" width="wide">
      <PageHeader
        title="Support tasks"
        description="Work the platform opened for a person: duplicate settlements, ledger imbalances, returned payouts, dunning escalations."
        isBusy={isFetching && !isLoading}
      />

      <ActionOutcomeAlert outcome={resolve.outcome} onDismiss={resolve.clearOutcome} />

      <FilterBar label="Support task filters" activeCount={filter === 'open' ? 0 : 1} onClear={() => setFilter('open')}>
        <Select
          id="support-task-status"
          label="Status"
          value={filter}
          onValueChange={(next) => setFilter(next)}
          options={FILTERS.map((value) => ({
            value,
            label: value === 'all' ? 'All tasks' : labelise(value),
          }))}
        />
      </FilterBar>

      {error ? (
        <AdminQueryError error={error} title="We could not load support tasks" what="support tasks" onRetry={refetch} />
      ) : (
        <>
          <DataTable<SupportTask>
            caption={filter === 'open' ? 'Open support tasks' : 'Support tasks'}
            columns={columns}
            rows={rows}
            isLoading={isLoading}
            emptyState={
              <EmptyRows
                title={filter === 'open' ? 'No open tasks' : 'No tasks'}
                body={filter === 'open' ? 'Nothing needs a person right now.' : 'No task matches this filter.'}
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
            resourceLabel="tasks"
          />
        </>
      )}

      <ConfirmActionDialog
        open={target !== null}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title={target ? `Resolve “${target.title}”?` : 'Resolve task?'}
        description="The task is closed and leaves the open queue. Say what you did, so the next person does not redo it."
        confirmLabel="Resolve task"
        note={{
          id: 'support-task-resolution',
          label: 'Resolution note',
          hint: 'What you found and what you did.',
          required: true,
          requiredMessage: 'Write what you did before closing the task.',
          maxLength: 2000,
        }}
        isPending={resolve.isPending}
        errorMessage={resolve.errorMessage}
        onConfirm={(note) => {
          if (target) resolve.run({ taskId: target.id, note }, { onSuccess: close });
        }}
      />
    </PageContainer>
  );
}
