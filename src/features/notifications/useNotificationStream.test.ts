/**
 * `useNotificationStream` — the console's only push channel, and the only file in the repo
 * allowed to have that name (blueprint §10).
 *
 * This is a **client, not a consumer**: it holds a WebSocket against payzeno-api's
 * `/ws/notifications`. There is no queue, no `LISTENS_ON`, and nothing here subscribes to a
 * bus. `FakeWebSocket` (installed in `src/test/setup.ts`) is what makes open/message/reconnect
 * drivable — jsdom's WebSocket opens a real socket to a port nothing is listening on.
 */
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@api/queryKeys';
import { useNotificationStream } from '@features/notifications/useNotificationStream';
import { makeNotification } from '@/test/factories';
import { FakeWebSocket } from '@/test/setup';
import { renderHookWithProviders, waitFor } from '@/test/render';

afterEach(() => {
  vi.useRealTimers();
});

function openSocket(): FakeWebSocket {
  const socket = FakeWebSocket.last();
  act(() => {
    socket.simulateOpen();
  });
  return socket;
}

describe('connecting', () => {
  it('opens a socket at VITE_WS_URL', () => {
    renderHookWithProviders(() => useNotificationStream());

    expect(FakeWebSocket.last().url).toBe('ws://localhost/ws/notifications');
  });

  it('reports its state as it moves from connecting to open', async () => {
    const { result } = renderHookWithProviders(() => useNotificationStream());

    expect(result.current.state).toBe('connecting');

    openSocket();

    await waitFor(() => {
      expect(result.current.state).toBe('open');
    });
  });

  it('opens no socket at all when disabled — there is no session to authorise it', () => {
    const before = FakeWebSocket.instances.length;
    renderHookWithProviders(() => useNotificationStream({ enabled: false }));

    expect(FakeWebSocket.instances).toHaveLength(before);
  });

  it('starts with an empty, unread-free list', () => {
    const { result } = renderHookWithProviders(() => useNotificationStream());

    expect(result.current.entries).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.streamError).toBeNull();
  });

  it('closes the socket on unmount, so a route change leaves nothing dialling', () => {
    const { unmount } = renderHookWithProviders(() => useNotificationStream());
    const socket = FakeWebSocket.last();

    unmount();

    expect(socket.readyState).toBe(FakeWebSocket.CLOSED);
  });
});

describe('receiving messages', () => {
  it('adds a surfaced notification to the list, newest first', async () => {
    const { result } = renderHookWithProviders(() => useNotificationStream());
    const socket = openSocket();

    act(() => {
      socket.simulateMessage(makeNotification({ id: 'ntf_1', title: 'Payout failed' }));
      socket.simulateMessage(
        makeNotification({ id: 'ntf_2', type: 'dispute.opened', title: 'Dispute opened' }),
      );
    });

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(2);
    });
    expect(result.current.entries[0]?.id).toBe('ntf_2');
  });

  it('counts unread entries', async () => {
    const { result } = renderHookWithProviders(() => useNotificationStream());
    const socket = openSocket();

    act(() => {
      socket.simulateMessage(makeNotification({ id: 'ntf_1' }));
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(1);
    });
  });

  it('ignores an event type the console does not surface', async () => {
    const { result } = renderHookWithProviders(() => useNotificationStream());
    const socket = openSocket();

    act(() => {
      socket.simulateMessage(makeNotification({ id: 'ntf_x', type: 'payment.captured' }));
    });

    await waitFor(() => {
      expect(result.current.state).toBe('open');
    });
    expect(result.current.entries).toEqual([]);
  });

  it('de-duplicates a redelivered frame by id', async () => {
    const { result } = renderHookWithProviders(() => useNotificationStream());
    const socket = openSocket();

    act(() => {
      socket.simulateMessage(makeNotification({ id: 'ntf_same' }));
      socket.simulateMessage(makeNotification({ id: 'ntf_same' }));
    });

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(1);
    });
  });

  it('survives a malformed frame without tearing the socket down', async () => {
    const { result } = renderHookWithProviders(() => useNotificationStream());
    const socket = openSocket();

    act(() => {
      socket.simulateMessage('{not json');
      socket.simulateMessage({ id: 'partial' });
    });

    await waitFor(() => {
      expect(result.current.state).toBe('open');
    });
    expect(result.current.entries).toEqual([]);
  });
});

describe('cache invalidation on push', () => {
  it('invalidates payouts and balance on payout.failed', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useNotificationStream());
    queryClient.setQueryData(queryKeys.payouts.list({ limit: 25 }), {
      data: [],
      next_cursor: null,
      has_more: false,
    });
    queryClient.setQueryData(queryKeys.balance.current('GBP'), { available_minor: 1 });

    const socket = openSocket();
    act(() => {
      socket.simulateMessage(makeNotification({ type: 'payout.failed' }));
    });

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(1);
    });

    expect(queryClient.getQueryState(queryKeys.payouts.list({ limit: 25 }))?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(queryKeys.balance.current('GBP'))?.isInvalidated).toBe(true);
  });

  it('invalidates settlements on settlement.completed', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useNotificationStream());
    queryClient.setQueryData(queryKeys.settlements.list({}), {
      data: [],
      next_cursor: null,
      has_more: false,
    });

    const socket = openSocket();
    act(() => {
      socket.simulateMessage(
        makeNotification({ id: 'ntf_s', type: 'settlement.completed' }),
      );
    });

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(1);
    });
    expect(queryClient.getQueryState(queryKeys.settlements.list({}))?.isInvalidated).toBe(true);
  });

  it('invalidates disputes on dispute.opened', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useNotificationStream());
    queryClient.setQueryData(queryKeys.disputes.list({}), {
      data: [],
      next_cursor: null,
      has_more: false,
    });

    const socket = openSocket();
    act(() => {
      socket.simulateMessage(makeNotification({ id: 'ntf_d', type: 'dispute.opened' }));
    });

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(1);
    });
    expect(queryClient.getQueryState(queryKeys.disputes.list({}))?.isInvalidated).toBe(true);
  });
});

describe('read state', () => {
  it('marks one entry read', async () => {
    const { result } = renderHookWithProviders(() => useNotificationStream());
    const socket = openSocket();

    act(() => {
      socket.simulateMessage(makeNotification({ id: 'ntf_1' }));
      socket.simulateMessage(makeNotification({ id: 'ntf_2', type: 'dispute.opened' }));
    });
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    act(() => {
      result.current.markRead('ntf_1');
    });

    expect(result.current.unreadCount).toBe(1);
  });

  it('marks them all read', async () => {
    const { result } = renderHookWithProviders(() => useNotificationStream());
    const socket = openSocket();

    act(() => {
      socket.simulateMessage(makeNotification({ id: 'ntf_1' }));
      socket.simulateMessage(makeNotification({ id: 'ntf_2', type: 'dispute.opened' }));
    });
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    act(() => {
      result.current.markAllRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.entries).toHaveLength(2);
  });

  it('dismisses an entry entirely', async () => {
    const { result } = renderHookWithProviders(() => useNotificationStream());
    const socket = openSocket();

    act(() => {
      socket.simulateMessage(makeNotification({ id: 'ntf_1' }));
    });
    await waitFor(() => {
      expect(result.current.entries).toHaveLength(1);
    });

    act(() => {
      result.current.dismiss('ntf_1');
    });

    expect(result.current.entries).toEqual([]);
  });
});

describe('reconnecting', () => {
  it('goes to reconnecting when the server drops the connection', async () => {
    vi.useFakeTimers();
    const { result } = renderHookWithProviders(() => useNotificationStream());
    const socket = FakeWebSocket.last();

    act(() => {
      socket.simulateOpen();
      socket.simulateClose();
    });

    expect(result.current.state).toBe('reconnecting');
  });

  it('dials again after its backoff', async () => {
    vi.useFakeTimers();
    renderHookWithProviders(() => useNotificationStream());
    const first = FakeWebSocket.last();

    act(() => {
      first.simulateOpen();
      first.simulateClose();
    });

    const before = FakeWebSocket.instances.length;
    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(FakeWebSocket.instances.length).toBeGreaterThan(before);
  });

  it('does not reconnect after the caller closed it', () => {
    vi.useFakeTimers();
    const { unmount } = renderHookWithProviders(() => useNotificationStream());

    unmount();
    const before = FakeWebSocket.instances.length;

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(FakeWebSocket.instances).toHaveLength(before);
  });
});
