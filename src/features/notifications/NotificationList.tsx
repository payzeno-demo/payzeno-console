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

