/**
 * `ColumnDef<DisputeRow>[]`.
 *
 * The "Respond by" column is the whole point of this table. It renders the remaining hours,
 * not the raw timestamp, because every merchant who has ever lost a dispute lost it by
 * reading a due date in the wrong timezone.
 */
import { Link } from 'react-router-dom';

import type { DisputeReason, DisputeStatus } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { humanise } from '@lib/format';
import { ROUTES } from '@/routes';
import type { DisputeRow } from '@/types/view-models';

/** Statuses where the merchant still has something to do. Everything else is history. */
export const ACTIONABLE_STATUSES: ReadonlySet<DisputeStatus> = new Set([
  'needs_response',
  'warning_needs_response',
]);

export function reasonLabel(reason: DisputeReason): string {
  return reason === 'general' ? 'Other' : humanise(reason);
}

/** `36.4` → `36h left`; negative → `closed`; null → em dash. */
export function formatRemaining(hours: number | null): string {
  if (hours === null) return '—';
  if (hours <= 0) return 'closed';
  if (hours < 48) return `${Math.floor(hours)}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

export const disputeColumns: ReadonlyArray<ColumnDef<DisputeRow>> = [
  {
    id: 'id',
    header: 'Dispute',
    width: '16rem',
    cell: (row) => (
      <Link to={ROUTES.disputes.detail(row.id)}>
        <IdCell value={row.id} />
      </Link>
    ),
    exportValue: (row) => row.id,
  },
  {
    id: 'charge_id',
    header: 'Charge',
    cell: (row) => (
