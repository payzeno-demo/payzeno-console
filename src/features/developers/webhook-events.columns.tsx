/**
 * `ColumnDef<WebhookEventRow>[]`.
 *
 * The columns are ordered the way a developer debugs: what happened, to which endpoint, how
 * many times we tried, what the last response was. `last_response_status` is the field that
 * ends most support threads.
 */
import { Link } from 'react-router-dom';

import type { PublicEventType } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { StatusPill } from '@components/data/StatusPill';
import { ellipsis, formatCount } from '@lib/format';
import { ROUTES } from '@/routes';
import type { WebhookEventRow } from '@/types/view-models';

/** Plain-English label for the four health states the table collapses status into. */
export function healthLabel(health: WebhookEventRow['_health']): string {
  switch (health) {
    case 'delivered':
      return 'Delivered';
    case 'pending':
      return 'Retrying';
    case 'failing':
      return 'Failing';
    case 'dead':
      return 'Gave up';
  }
}

/** The event types most worth filtering to, in the order developers ask for them. */
export const COMMON_EVENT_TYPES: ReadonlyArray<PublicEventType> = [
  'payment.captured',
  'payment.failed',
  'refund.succeeded',
  'dispute.opened',
  'payout.paid',
  'payout.failed',
  'settlement.completed',
];

export const webhookEventColumns: ReadonlyArray<ColumnDef<WebhookEventRow>> = [
  {
    id: 'type',
    header: 'Event',
    cell: (row) => <Link to={ROUTES.developers.webhookEvent(row.id)}>{row.type}</Link>,
    exportValue: (row) => row.type,
    width: '16rem',
  },
  {
    id: 'endpoint_id',
    header: 'Endpoint',
    cell: (row) => <IdCell value={row.endpoint_id} />,
    exportValue: (row) => row.endpoint_id,
  },
  {
    id: 'health',
    header: 'Delivery',
    cell: (row) => <StatusPill status={row._health} label={healthLabel(row._health)} />,
    exportValue: (row) => row._health,
  },
  {
    id: 'attempt_count',
    header: 'Attempts',
    align: 'end',
    sortable: true,
    cell: (row) => <span>{formatCount(row.attempt_count)}</span>,
    exportValue: (row) => String(row.attempt_count),
  },
  {
    id: 'last_response_status',
    header: 'Last response',
    align: 'end',
    cell: (row) => <span>{row.last_response_status ?? '—'}</span>,
    exportValue: (row) => String(row.last_response_status ?? ''),
  },
  {
    id: 'last_error',
    header: 'Last error',
    cell: (row) => <span>{row.last_error ? ellipsis(row.last_error, 40) : '—'}</span>,
    exportValue: (row) => row.last_error ?? '',
  },
  {
    id: 'next_attempt_at',
    header: 'Next attempt',
    cell: (row) => <DateCell value={row.next_attempt_at} />,
    exportValue: (row) => row.next_attempt_at ?? '',
  },
  {
    id: 'created_at',
    header: 'Created',
    sortable: true,
    cell: (row) => <DateCell value={row.created_at} />,
    exportValue: (row) => row.created_at,
  },
];
