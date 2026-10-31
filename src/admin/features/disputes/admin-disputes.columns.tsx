/**
 * Columns for the cross-merchant disputes table. The last column is the per-row "Accept"
 * action, so the factory takes the handler and whether this staff member may use it.
 */
import type { Dispute } from '@payzeno/contracts';
import { Link } from 'react-router-dom';

import type { ColumnDef } from '@components/data/column.types';
import { DateCell, dateExportValue } from '@components/data/DateCell';
import { MoneyCell, moneyExportValue } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { Button } from '@components/ui/Button';
import { color } from '@components/ui/tokens';
import { labelise } from '@lib/format';

import { ADMIN_ROUTES } from '../../adminRoutes';

export interface DisputeColumnOptions {
  canAccept: boolean;
  onAccept: (dispute: Dispute) => void;
}

/** Accepting is legal from `needs_response` only (api `DisputeStateMachine`). */
export function isAcceptable(dispute: Pick<Dispute, 'status'>): boolean {
  return dispute.status === 'needs_response';
}

export function adminDisputeColumns({ canAccept, onAccept }: DisputeColumnOptions): ReadonlyArray<ColumnDef<Dispute>> {
  return [
    {
      id: 'dispute',
      header: 'Dispute',
      exportValue: (row) => row.id,
      cell: (row) => <code>{row.id}</code>,
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
      id: 'amount',
      header: 'Amount',
      align: 'end',
      sortable: true,
      exportValue: (row) => moneyExportValue(row.amount_minor, row.currency),
      cell: (row) => <MoneyCell amountMinor={row.amount_minor} currency={row.currency} />,
    },
    {
      id: 'reason',
      header: 'Reason',
      sortable: true,
      exportValue: (row) => row.reason,
      cell: (row) => `${labelise(row.reason)} (${row.network_reason_code})`,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      exportValue: (row) => row.status,
      cell: (row) => <StatusPill status={row.status} srPrefix="Dispute status" size="sm" />,
    },
    {
      id: 'due',
      header: 'Evidence due',
      sortable: true,
      exportValue: (row) => dateExportValue(row.evidence_due_by),
      cell: (row) => <DateCell value={row.evidence_due_by} />,
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
        isAcceptable(row) ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={!canAccept}
            title={canAccept ? undefined : 'Needs the risk role.'}
            aria-label={`Accept dispute ${row.id} on the merchant's behalf`}
            onClick={() => onAccept(row)}
          >
            Accept
          </Button>
        ) : (
          <span style={{ color: color.textMuted }}>—</span>
        ),
    },
  ];
}
