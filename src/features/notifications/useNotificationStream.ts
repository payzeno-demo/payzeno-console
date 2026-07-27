/**
 * `useNotificationStream()` — the console's only push channel.
 *
 * There is exactly one file with this name, and it is here, not in `src/hooks/`
 * (interfaces.md §4.1). `NotificationProvider` mounts it **once** and fans the result out
 * over context; mounting it twice would open two sockets against
 * `NotificationsGateway.push()` and every alert would arrive in duplicate.
 *
 * This is a WebSocket client. The console consumes no queue and emits no event.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MockNotificationSocket } from '@api/ws/mock-notification-socket';
import { NotificationSocket } from '@api/ws/notification-socket';
import type { SocketClient, SocketState } from '@api/ws/socket-client';
import { queryKeys } from '@api/queryKeys';
import { NotificationStreamError } from '@lib/errors';
import { captureError } from '@lib/telemetry';

import type { ConsoleNotification, NotificationEntry } from './notification.types';
import { isSurfaced } from './notification.types';

const MAX_ENTRIES = 50;

export interface NotificationStream {
  entries: NotificationEntry[];
  unreadCount: number;
  state: SocketState;
  /** Set when the socket gave up past MAX_RECONNECTS. Rendered as a degraded banner. */
  streamError: NotificationStreamError | null;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

export interface NotificationStreamOptions {
  /** `?mock=1` swaps the socket the same way it swaps the transport. */
  mock?: boolean;
  enabled?: boolean;
}

export function useNotificationStream(
  options: NotificationStreamOptions = {},
): NotificationStream {
  const { mock = false, enabled = true } = options;
  const queryClient = useQueryClient();

  const [entries, setEntries] = useState<NotificationEntry[]>([]);
  const [state, setState] = useState<SocketState>('idle');
  const [streamError, setStreamError] = useState<NotificationStreamError | null>(null);
  const socketRef = useRef<SocketClient<ConsoleNotification> | null>(null);

  /**
   * A push tells us server-side state changed. Invalidating the matching query family is
   * what makes the payouts table update behind the toast without a manual refresh.
   */
  const invalidateFor = useCallback(
    (notification: ConsoleNotification) => {
      switch (notification.type) {
        case 'payout.failed':
        case 'payout.paid':
        case 'payout.returned':
          void queryClient.invalidateQueries({ queryKey: queryKeys.payouts.all });
          void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
          break;
        case 'settlement.completed':
          void queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
          break;
        case 'dispute.opened':
          void queryClient.invalidateQueries({ queryKey: queryKeys.disputes.all });
          break;
        default:
          break;
      }
    },
    [queryClient],
  );

  const onMessage = useCallback(
    (notification: ConsoleNotification) => {
      if (!isSurfaced(notification.type)) return;

      setEntries((current) => {
        if (current.some((e) => e.id === notification.id)) return current;
        const entry: NotificationEntry = { ...notification, read: false, receivedAt: Date.now() };
        return [entry, ...current].slice(0, MAX_ENTRIES);
      });

      invalidateFor(notification);
    },
    [invalidateFor],
  );

  useEffect(() => {
    if (!enabled) return;

    const handlers = {
      onMessage,
      onStateChange: setState,
      onGiveUp: (attempts: number) => {
        const err = new NotificationStreamError(attempts);
        setStreamError(err);
        captureError(err, { attempts });
      },
    };

    const socket = mock
      ? new MockNotificationSocket(handlers)
      : new NotificationSocket(handlers);

    socketRef.current = socket;
    socket.connect();

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, mock, onMessage]);

  const markRead = useCallback((id: string) => {
    setEntries((current) => current.map((e) => (e.id === id ? { ...e, read: true } : e)));
  }, []);

  const markAllRead = useCallback(() => {
    setEntries((current) => current.map((e) => ({ ...e, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setEntries((current) => current.filter((e) => e.id !== id));
  }, []);

  const unreadCount = useMemo(() => entries.filter((e) => !e.read).length, [entries]);

  return { entries, unreadCount, state, streamError, markRead, markAllRead, dismiss };
}
