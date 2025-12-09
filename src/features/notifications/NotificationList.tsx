/**
 * The list inside the bell's popover. Presentational: it takes entries and two callbacks and
 * never fetches anything.
 *
 * `payout.failed` is styled as critical and links straight to the payout detail page —
 * domain-model.md §9 makes it the one event the console surfaces directly, because a failed
 * payout means the merchant's money did not arrive and the alternative is that they find out
 * from their bank.
 */
import { Link } from 'react-router-dom';

import { ROUTES } from '@/routes';
import { StatusPill } from '@components/data/StatusPill';
import { formatRelativeTime } from '@lib/date';

import type { NotificationEntry } from './notification.types';
import { severityOf } from './notification.types';

export interface NotificationListProps {
  entries: ReadonlyArray<NotificationEntry>;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

function linkFor(entry: NotificationEntry): string {
  switch (entry.type) {
    case 'payout.failed':
    case 'payout.paid':
    case 'payout.returned':
      return ROUTES.payouts.detail(entry.resource_id);
    case 'settlement.completed':
      return ROUTES.settlements.detail(entry.resource_id);
    case 'dispute.opened':
      return ROUTES.disputes.detail(entry.resource_id);
    default:
      return ROUTES.reporting.index;
  }
}

export function NotificationList({ entries, onRead, onDismiss }: NotificationListProps) {
  if (entries.length === 0) {
    return <p>You are all caught up.</p>;
  }

  return (
    <ul aria-label="Recent notifications">
      {entries.map((entry) => {
        const severity = severityOf(entry.type);
        return (
          <li key={entry.id} data-severity={severity} data-read={entry.read}>
            <StatusPill status={severity === 'critical' ? 'failed' : 'pending'} label={entry.type} />

            <Link to={linkFor(entry)} onClick={() => onRead(entry.id)}>
              {entry.title}
            </Link>

            <p>{entry.body}</p>
            <time dateTime={entry.occurred_at}>{formatRelativeTime(entry.occurred_at)}</time>

            <button
              type="button"
              aria-label={`Dismiss ${entry.title}`}
              onClick={() => onDismiss(entry.id)}
            >
