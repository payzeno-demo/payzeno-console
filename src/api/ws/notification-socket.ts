import { runtime } from '@config/runtime';
import type { ConsoleNotification } from '@features/notifications/notification.types';
import { isConsoleNotification } from '@features/notifications/notification.types';

import { SocketClient } from './socket-client';
import type { SocketHandlers } from './socket-client';

/**
 * `NotificationSocket` — connects to payzeno-api's `/ws/notifications` at `VITE_WS_URL`.
 *
 * The server side is `NotificationsGateway`, fed by `NotificationRelayConsumer` off the
 * `payzeno-console-notifications` queue. Auth is the ordinary session cookie plus the CSRF
 * header on the upgrade request; the socket is scoped to `principal.merchant_id` and
 * receives nothing else.
 *
 * Surfaced event types: `payout.failed`, `settlement.completed`, `dispute.opened`.
 * `payout.failed` is the one the console surfaces directly and loudly — a failed payout means
 * the merchant's money did not arrive and they will find out from their bank otherwise.
 */
export class NotificationSocket extends SocketClient<ConsoleNotification> {
  protected readonly url: string;

  constructor(handlers: SocketHandlers<ConsoleNotification>, url: string = runtime.wsUrl) {
    super(handlers);
    this.url = url;
  }

  /**
   * Frames that are not a `ConsoleNotification` (heartbeat pongs, gateway `hello`) return
   * null and are dropped without touching the notification list.
   */
  protected parse(raw: MessageEvent): ConsoleNotification | null {
    if (typeof raw.data !== 'string') return null;

    let decoded: unknown;
    try {
      decoded = JSON.parse(raw.data);
    } catch {
      // A malformed frame is not worth tearing the socket down for.
