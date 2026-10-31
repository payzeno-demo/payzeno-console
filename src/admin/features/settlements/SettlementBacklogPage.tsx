/**
 * `SettlementBacklogPage` — `/settlements` (finance).
 *
 * The reconciliation backlog across every merchant: counts by state, how long the oldest retry
 * has been due, the per-batch breakdown and the items themselves when the api sends them, and a
 * retry per item. Retrying by batch + item id is always available, because the counts alone
 * (the contracts' `ReconciliationBacklog`) carry no ids.
 */
import type { ReconciliationItem } from '@payzeno/contracts';
import { useState } from 'react';
import type { FormEvent } from 'react';

import type { ColumnDef } from '@components/data/column.types';
import { DataTable } from '@components/data/DataTable';
import { DateCell, dateExportValue } from '@components/data/DateCell';
import { EmptyRows } from '@components/data/EmptyRows';
import { MoneyCell, moneyExportValue } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { FormField } from '@components/form/FormField';
import { PageContainer, PageSections } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Button } from '@components/ui/Button';
import { Card, StatCard } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { color, font, space } from '@components/ui/tokens';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { formatRelative } from '@lib/date';
import { labelise } from '@lib/format';

import { ACTION_ROLES, describeRequirement } from '../../app/staff-roles';
import { useStaffPermissions } from '../../app/StaffSessionContext';
import { ActionOutcomeAlert } from '../../components/ActionOutcome';
import { AdminQueryError } from '../../components/AdminQueryError';
import { ConfirmActionDialog } from '../../components/ConfirmActionDialog';
import type { AdminBacklogBucket } from '../../types/settlement-backlog';
import { backlogTotal } from '../../types/settlement-backlog';

import { useRetryBacklogItem } from './useRetryBacklogItem';
import { useSettlementBacklog } from './useSettlementBacklog';

interface RetryTarget {
  batchId: string;
  itemId: string;
  merchantId: string;
}

interface BucketRow extends AdminBacklogBucket {
  id: string;
}

/** Statuses a retry makes sense for. `settling` is already in flight; `settled` is done. */
function isRetryable(item: Pick<ReconciliationItem, 'status'>): boolean {
  return item.status !== 'settled' && item.status !== 'settling';
}

export function SettlementBacklogPage() {
  useDocumentTitle('Settlements', 'Admin');

  const { backlog, isLoading, isFetching, error, refetch } = useSettlementBacklog();
  const retry = useRetryBacklogItem();
  const { can } = useStaffPermissions();
  const canRetry = can('settlements:retry');

  const [target, setTarget] = useState<RetryTarget | null>(null);
  const [manualBatch, setManualBatch] = useState('');
  const [manualItem, setManualItem] = useState('');
  const [manualMerchant, setManualMerchant] = useState('');

  const close = () => {
    setTarget(null);
    retry.reset();
  };

  if (isLoading) return <LoadingPage label="Loading the settlement backlog" />;

  const itemColumns: ReadonlyArray<ColumnDef<ReconciliationItem>> = [
    { id: 'item', header: 'Item', exportValue: (row) => row.id, cell: (row) => <code>{row.id}</code> },
    { id: 'batch', header: 'Batch', exportValue: (row) => row.batch_id, cell: (row) => <code>{row.batch_id}</code> },
    {
      id: 'merchant',
      header: 'Merchant',
      exportValue: (row) => row.merchant_id ?? '',
      cell: (row) => (row.merchant_id ? <code>{row.merchant_id}</code> : 'Unmatched'),
    },
    { id: 'line', header: 'Line', exportValue: (row) => row.line_type, cell: (row) => labelise(row.line_type) },
    {
      id: 'gross',
      header: 'Gross',
      align: 'end',
      sortable: true,
      exportValue: (row) => moneyExportValue(row.gross_minor, row.currency),
      cell: (row) => <MoneyCell amountMinor={row.gross_minor} currency={row.currency} signed />,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      exportValue: (row) => row.status,
      cell: (row) => <StatusPill status={row.status} srPrefix="Item status" size="sm" />,
    },
    {
      id: 'attempts',
      header: 'Attempts',
      align: 'end',
      sortable: true,
      exportValue: (row) => String(row.attempt_count).padStart(4, '0'),
      cell: (row) => row.attempt_count,
    },
    {
      id: 'error',
      header: 'Last error',
      exportValue: (row) => row.last_error_code ?? '',
      cell: (row) => (row.last_error_code ? <code>{row.last_error_code}</code> : '—'),
    },
    {
      id: 'next',
      header: 'Next attempt',
      sortable: true,
      exportValue: (row) => dateExportValue(row.next_attempt_at),
      cell: (row) => <DateCell value={row.next_attempt_at} />,
    },
    {
      id: 'actions',
      header: 'Action',
      cell: (row) =>
        isRetryable(row) ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={!canRetry || !row.merchant_id}
            title={
              !canRetry
                ? `Needs ${describeRequirement(ACTION_ROLES['settlements:retry'])}.`
                : !row.merchant_id
                  ? 'Unmatched line: no merchant to retry it for.'
                  : undefined
            }
            aria-label={`Retry item ${row.id}`}
            onClick={() => {
              if (row.merchant_id) {
                setTarget({ batchId: row.batch_id, itemId: row.id, merchantId: row.merchant_id });
              }
            }}
          >
            Retry
          </Button>
        ) : (
          <span style={{ color: color.textMuted }}>—</span>
        ),
    },
  ];

  const bucketColumns: ReadonlyArray<ColumnDef<BucketRow>> = [
    { id: 'batch', header: 'Batch', exportValue: (row) => row.batch_id, cell: (row) => <code>{row.batch_id}</code> },
    { id: 'currency', header: 'Currency', exportValue: (row) => row.currency, cell: (row) => row.currency },
    {
      id: 'status',
      header: 'State',
      exportValue: (row) => row.status,
      cell: (row) => <StatusPill status={row.status} srPrefix="Item status" size="sm" />,
    },
    {
      id: 'items',
      header: 'Items',
      align: 'end',
      sortable: true,
      exportValue: (row) => String(row.item_count).padStart(6, '0'),
      cell: (row) => row.item_count.toLocaleString(),
    },
    {
      id: 'gross',
      header: 'Gross',
      align: 'end',
      exportValue: (row) => moneyExportValue(row.gross_minor, row.currency),
      cell: (row) => <MoneyCell amountMinor={row.gross_minor} currency={row.currency} signed />,
    },
    {
      id: 'oldest',
      header: 'Oldest retry due',
      exportValue: (row) => dateExportValue(row.oldest_next_attempt_at),
      cell: (row) => <DateCell value={row.oldest_next_attempt_at} />,
    },
  ];

  const submitManual = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const batchId = manualBatch.trim();
    const itemId = manualItem.trim();
    const merchantId = manualMerchant.trim();
    if (!batchId || !itemId || !merchantId) return;
    setTarget({ batchId, itemId, merchantId });
  };

  return (
    <PageContainer as="main" width="wide">
      <PageHeader
        title="Settlements"
        description="The reconciliation backlog across every merchant: what is still waiting to settle, and why."
        isBusy={isFetching}
      />

      <ActionOutcomeAlert outcome={retry.outcome} onDismiss={retry.clearOutcome} />

      {error || !backlog ? (
        <AdminQueryError error={error} title="We could not load the settlement backlog" what="settlements" onRetry={refetch} />
      ) : (
        <PageSections>
          <section aria-label="Backlog summary">
            <div style={{ display: 'grid', gap: space[4], gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <StatCard label="Retryable" value={backlog.retryable.toLocaleString()} hint="The sweep and the drain will pick these up" />
              <StatCard label="Failed" value={backlog.failed.toLocaleString()} tone={backlog.failed > 0 ? 'danger' : 'neutral'} />
              <StatCard label="Orphaned" value={backlog.orphaned.toLocaleString()} tone={backlog.orphaned > 0 ? 'danger' : 'neutral'} />
              <StatCard label="Needs review" value={backlog.needs_review.toLocaleString()} />
              <StatCard
                label="Variance exceeded"
                value={backlog.variance_exceeded.toLocaleString()}
                tone={backlog.variance_exceeded > 0 ? 'danger' : 'neutral'}
              />
              <StatCard
                label="Oldest retry due"
                value={backlog.oldest_retryable_at ? formatRelative(backlog.oldest_retryable_at) : '—'}
                hint={`${backlogTotal(backlog).toLocaleString()} items in the backlog`}
              />
            </div>
          </section>

          {backlog.buckets ? (
            <Card title="By batch" headingLevel={2} flush>
              <div style={{ padding: space[4] }}>
                <DataTable<BucketRow>
                  caption="Backlog per settlement batch and item state, largest first"
                  columns={bucketColumns}
                  rows={backlog.buckets.map((bucket) => ({ ...bucket, id: `${bucket.batch_id}:${bucket.status}` }))}
                  isLoading={false}
                  emptyState={<EmptyRows title="Nothing waiting" body="Every batch is fully settled." />}
                />
              </div>
            </Card>
          ) : null}

          {backlog.items ? (
            <Card title="Items" headingLevel={2} flush>
              <div style={{ padding: space[4] }}>
                <DataTable<ReconciliationItem>
                  caption="Reconciliation items waiting to settle"
                  columns={itemColumns}
                  rows={backlog.items}
                  isLoading={false}
                  emptyState={<EmptyRows title="No items waiting" body="Nothing is stuck." />}
                />
              </div>
            </Card>
          ) : null}

          <Card
            title="Retry an item by id"
            headingLevel={2}
            description="For an item you have from an alert, a support task or the ledger: its batch, the item, and the merchant it belongs to (the retry acts on that merchant's behalf)."
          >
            <form onSubmit={submitManual} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: space[3] }}>
              <FormField id="retry-batch-id" label="Batch id" required>
                {(wiring) => (
                  <Input
                    id={wiring.id}
                    value={manualBatch}
                    placeholder="sb_…"
                    onChange={(event) => setManualBatch(event.target.value)}
                    describedBy={wiring['aria-describedby']}
                  />
                )}
              </FormField>
              <FormField id="retry-item-id" label="Item id" required>
                {(wiring) => (
                  <Input
                    id={wiring.id}
                    value={manualItem}
                    placeholder="ri_…"
                    onChange={(event) => setManualItem(event.target.value)}
                    describedBy={wiring['aria-describedby']}
                  />
                )}
              </FormField>
              <FormField id="retry-merchant-id" label="Merchant id" required>
                {(wiring) => (
                  <Input
                    id={wiring.id}
                    value={manualMerchant}
                    placeholder="mer_…"
                    onChange={(event) => setManualMerchant(event.target.value)}
                    describedBy={wiring['aria-describedby']}
                  />
                )}
              </FormField>
              <Button
                type="submit"
                variant="secondary"
                disabled={
                  !canRetry ||
                  manualBatch.trim() === '' ||
                  manualItem.trim() === '' ||
                  manualMerchant.trim() === ''
                }
              >
                Retry item
              </Button>
            </form>
            {!canRetry ? (
              <p style={{ margin: `${space[2]} 0 0`, fontSize: font.size.sm, color: color.textSecondary }}>
                Retrying needs {describeRequirement(ACTION_ROLES['settlements:retry'])}.
              </p>
            ) : null}
          </Card>
        </PageSections>
      )}

      <ConfirmActionDialog
        open={target !== null}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title={target ? `Retry ${target.itemId}?` : 'Retry item?'}
        description="The ledger tries to settle this item again, asynchronously. If a reconciliation sweep already holds the batch, the item is being settled already and nothing more happens."
        confirmLabel="Retry item"
        note={{ id: 'settlement-retry-reason', label: 'Reason', hint: 'Recorded with the retry.', maxLength: 500 }}
        isPending={retry.isPending}
        errorMessage={retry.errorMessage}
        onConfirm={(reason) => {
          if (target) retry.run({ ...target, reason }, { onSuccess: close });
        }}
      >
        {target ? (
          <p style={{ margin: 0, fontSize: font.size.sm, color: color.textSecondary }}>
            Batch <code>{target.batchId}</code> · item <code>{target.itemId}</code> · merchant{' '}
            <code>{target.merchantId}</code>
          </p>
        ) : null}
      </ConfirmActionDialog>
    </PageContainer>
  );
}
