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
