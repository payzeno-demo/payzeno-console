/**
 * Mounts the notification stream **once** and fans it out over context.
 *
 * `useNotificationStream()` opens a WebSocket. Calling it from two components opens two
 * sockets against `NotificationsGateway`, and every alert arrives twice — which is exactly
 * what happened when the bell and the payouts page each called it (PAY-1889). This provider is
 * the single mount point; `<NotificationBell />` and anything else read `useNotifications()`.
 *
 * The console is a WebSocket **client**, not a bus consumer. There is no SQS client in this
 * repo, no consumer class and no `LISTENS_ON` surface (api-surface.md §14).
 *
 * Side effect worth knowing about: a `payout.failed` frame raises an error toast as well as
 * landing in the bell, because a failed payout means money did not arrive and the bell is not
 * loud enough on its own (domain-model.md §9).
 */
import { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { useNotificationStream } from '@features/notifications/useNotificationStream';
import type { NotificationStream } from '@features/notifications/useNotificationStream';
import { severityOf } from '@features/notifications/notification.types';

import { useSessionContext } from './SessionContext';
import { useToast } from './ToastProvider';
import { shouldUseMock } from './TransportProvider';

const NotificationContext = createContext<NotificationStream | null>(null);

NotificationContext.displayName = 'NotificationContext';

/** Empty stream, used before sign-in and outside the provider. */
const EMPTY_STREAM: NotificationStream = {
  entries: [],
  unreadCount: 0,
  state: 'idle',
  streamError: null,
  markRead: () => undefined,
  markAllRead: () => undefined,
  dismiss: () => undefined,
};

/** Unread count on its own, for the nav badge. Avoids re-rendering on every entry change. */
export function useUnreadNotificationCount(): number {
  return useNotifications().unreadCount;
}
