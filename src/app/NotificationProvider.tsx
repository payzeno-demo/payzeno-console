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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const session = useSessionContext();
  const toast = useToast();

  // No session means no socket: the upgrade request would be rejected and the client would sit
  // in a reconnect loop against a 401 until it gave up.
  const stream = useNotificationStream({ enabled: session !== null, mock: shouldUseMock() });

  // Toast the loud ones, once each. The ref is what stops a re-render re-toasting the list.
  const toasted = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const entry of stream.entries) {
      if (toasted.current.has(entry.id)) continue;
      toasted.current.add(entry.id);

      if (severityOf(entry.type) === 'critical') {
        toast.error(entry.title, { description: entry.body });
      }
    }
  }, [stream.entries, toast]);

  return <NotificationContext.Provider value={stream}>{children}</NotificationContext.Provider>;
}

/**
 * The notification stream.
 *
 * Returns an inert stream outside the provider rather than throwing — `<NotificationBell />`
 * renders in the shell, which the login route also mounts in some tests.
 */
export function useNotifications(): NotificationStream {
  return useContext(NotificationContext) ?? EMPTY_STREAM;
}

/** Unread count on its own, for the nav badge. Avoids re-rendering on every entry change. */
export function useUnreadNotificationCount(): number {
  return useNotifications().unreadCount;
}
