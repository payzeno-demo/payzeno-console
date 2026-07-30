/**
 * `ColumnDef<SettlementItemRow>[]` for a batch's reconciliation items.
 *
 * Renamed from `itemColumns.tsx` in the PAY-2043 PR, which is also when the duplicate column
 * was added (the-incident.md §8).
 *
 * The columns are deliberately close to the ledger's own vocabulary — `line_type`,
 * `match_method`, `variance_minor` — because when finance calls Payzeno about an item they
 * read these words down the phone and the on-call engineer needs to find the same row.
 */
import type { ReconciliationItemStatus, ReconciliationLineType } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import type { SettlementItemRow } from '@types/view-models';

import { DuplicateBadge } from './components/DuplicateBadge';
import { RetryItemButton } from './components/RetryItemButton';

/** Lines that are not a sale never match a charge; `orphaned` on one of these is expected. */
const NON_SALE_LINE_TYPES: ReadonlySet<ReconciliationLineType> = new Set([
  'scheme_fee',
  'adjustment',
  'reserve_hold',
  'reserve_release',
]);

export function explainStatus(status: ReconciliationItemStatus, lineType: ReconciliationLineType) {
  if (status === 'orphaned' && NON_SALE_LINE_TYPES.has(lineType)) {
    return 'Fee or adjustment line — no charge to match.';
  }
  switch (status) {
    case 'retryable':
      return 'The last attempt failed and will be retried automatically.';
    case 'needs_review':
      return 'Matched heuristically. Someone has to confirm it.';
    case 'variance_exceeded':
      return 'The acquirer amount differs from the authorised amount beyond your tolerance.';
    case 'settling':
      return 'A settlement pass holds this item right now.';
    default:
      return '';
  }
}

export function settlementItemColumns(
  batchId: string,
): ReadonlyArray<ColumnDef<SettlementItemRow>> {
  return [
    {
      id: 'id',
      header: 'Item',
      cell: (row) => (
        <>
          <IdCell value={row.id} />
          {row._isDuplicateSuspect ? <DuplicateBadge attemptCount={row.attempt_count} /> : null}
        </>
      ),
      exportValue: (row) => row.id,
      width: '16rem',
    },
    {
      id: 'line_type',
      header: 'Line',
      cell: (row) => <span>{row.line_type.replace(/_/g, ' ')}</span>,
      exportValue: (row) => row.line_type,
    },
    {
      id: 'charge_id',
      header: 'Charge',
      cell: (row) => (row.charge_id ? <IdCell value={row.charge_id} /> : <span>Unmatched</span>),
      exportValue: (row) => row.charge_id ?? '',
    },
    {
      id: 'gross_minor',
      header: 'Gross',
      align: 'end',
      cell: (row) => <MoneyCell amountMinor={row.gross_minor} currency={row.currency} />,
      exportValue: (row) => String(row.gross_minor),
    },
    {
      id: 'fee_minor',
      header: 'Acquirer fee',
      align: 'end',
      cell: (row) => <MoneyCell amountMinor={row.fee_minor} currency={row.currency} />,
      exportValue: (row) => String(row.fee_minor),
    },
    {
      id: 'variance_minor',
      header: 'Variance',
      align: 'end',
      cell: (row) =>
        row.variance_minor === 0 ? (
          <span>—</span>
        ) : (
          <MoneyCell amountMinor={row.variance_minor} currency={row.currency} tone="warning" />
        ),
      exportValue: (row) => String(row.variance_minor),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <StatusPill
          status={row.status}
          label={row.status.replace(/_/g, ' ')}
          title={explainStatus(row.status, row.line_type)}
        />
      ),
      exportValue: (row) => row.status,
    },
    {
      id: 'attempts',
      header: 'Attempts',
      align: 'end',
      cell: (row) => <span>{row.attempt_count}</span>,
      exportValue: (row) => String(row.attempt_count),
    },
    {
      id: 'last_attempt_at',
      header: 'Last attempt',
      cell: (row) =>
        row.last_attempt_at ? (
          <DateCell value={row.last_attempt_at} precision="minute" />
        ) : (
          <span>—</span>
        ),
      exportValue: (row) => row.last_attempt_at ?? '',
    },
    {
      id: 'retry',
      header: 'Retry',
      align: 'end',
      cell: (row) => <RetryItemButton batchId={batchId} itemId={row.id} disabled={!row._isRetryable} />,
      exportValue: () => '',
    },
  ];
}
