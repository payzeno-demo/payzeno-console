/**
 * The bell in the top bar. Mounted by `components/layout/AppShell.tsx`, which is the one
 * place `components/**` is allowed to import from `features/**` (interfaces.md §4.1 puts the
 * bell in the shell; the eslint exemption is declared there, not here).
 *
 * a11y: the trigger is a real button with an `aria-label` that includes the unread count, and
 * the popover is labelled by the heading inside it. Tal will ask.
 */
import { useNotifications } from '@app/NotificationProvider';
import { Badge } from '@components/ui/Badge';
import { IconButton } from '@components/ui/IconButton';
import { Popover } from '@components/ui/Popover';

import { NotificationList } from './NotificationList';

export interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { entries, unreadCount, state, streamError, markAllRead, markRead, dismiss } =
    useNotifications();

  const label =
    unreadCount === 0
      ? 'Notifications, none unread'
      : `Notifications, ${unreadCount} unread`;
