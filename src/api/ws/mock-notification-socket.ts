import type { ConsoleNotification } from '@features/notifications/notification.types';

import { mockNotifications } from '../mock/fixtures';
import { jitteredDelay } from '../mock/latency';

import { SocketClient } from './socket-client';
import type { SocketHandlers } from './socket-client';

/**
 * `MockNotificationSocket` — the `?mock=1` concrete. Sales runs the demo on it, so it is
 * production code, not a test double.
 *
 * It never opens a real socket: `openSocket()` returns a minimal stand-in and the class
 * replays `fixtures.ts` notifications on a seeded schedule so the demo has a `payout.failed`
 * toast land roughly ninety seconds in, while someone is looking at the payouts tab.
 */
export class MockNotificationSocket extends SocketClient<ConsoleNotification> {
  protected readonly url = 'mock://notifications';

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(handlers: SocketHandlers<ConsoleNotification>) {
    super(handlers);
  }

  protected parse(raw: MessageEvent): ConsoleNotification | null {
    return (raw.data as ConsoleNotification | undefined) ?? null;
  }

  /**
   * A stand-in with just enough of the `WebSocket` surface for `SocketClient` to drive it.
   * `open` fires on the next tick so `connect()` transitions exactly as it does in prod.
   */
  protected override openSocket(): WebSocket {
    const listeners = new Map<string, Array<(ev: Event) => void>>();

    const fake = {
      readyState: WebSocket.CONNECTING,
      addEventListener(type: string, listener: (ev: Event) => void) {
        const bucket = listeners.get(type) ?? [];
        bucket.push(listener);
        listeners.set(type, bucket);
      },
      removeEventListener(type: string, listener: (ev: Event) => void) {
        const bucket = listeners.get(type) ?? [];
        listeners.set(
          type,
          bucket.filter((l) => l !== listener),
        );
      },
      send() {
        // Heartbeats go nowhere in mock mode.
      },
      close: () => {
        this.clearReplay();
        for (const listener of listeners.get('close') ?? []) listener(new Event('close'));
      },
    } as unknown as WebSocket;

    this.timers.push(
      setTimeout(() => {
        (fake as { readyState: number }).readyState = WebSocket.OPEN;
        for (const listener of listeners.get('open') ?? []) listener(new Event('open'));
        this.scheduleReplay((notification) => {
          for (const listener of listeners.get('message') ?? []) {
            listener({ data: notification } as unknown as MessageEvent);
          }
        });
      }, jitteredDelay('ws-open')),
    );

    return fake;
  }

  private scheduleReplay(emit: (n: ConsoleNotification) => void): void {
    mockNotifications.forEach((notification, index) => {
      const delay = 20_000 + index * 45_000 + jitteredDelay(notification.id);
      this.timers.push(setTimeout(() => emit(notification), delay));
    });
  }

  private clearReplay(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}
