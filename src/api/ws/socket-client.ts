/**
 * `SocketClient` — the console's only push abstraction.
 *
 * This is a WebSocket **client**, not a bus consumer. The console is not on SQS/SNS: the
 * `payzeno-console-notifications` queue is consumed by payzeno-api's
 * `NotificationRelayConsumer`, which fans out over `NotificationsGateway.push()`
 * (api-surface.md §14). Nothing in this repo emits or listens on the bus.
 *
 * Two concretes, both wired in production code: `NotificationSocket` (VITE_WS_URL) and
 * `MockNotificationSocket` (?mock=1, replays fixtures).
 */
import { WS_BACKOFF_MS, WS_HEARTBEAT_MS, WS_MAX_RECONNECTS } from '@config/constants';

export type SocketState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface SocketHandlers<TMessage> {
  onMessage: (message: TMessage) => void;
  onStateChange?: (state: SocketState) => void;
  onGiveUp?: (attempts: number) => void;
}

export abstract class SocketClient<TMessage> {
  protected abstract readonly url: string;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  protected constructor(protected readonly handlers: SocketHandlers<TMessage>) {}

  get currentState(): SocketState {
    return this.state;
  }

  get reconnectAttempts(): number {
    return this.attempts;
  }

  /** Exponential with full jitter, capped at 30s. Every open tab must not retry in lockstep. */
  protected backoffMs(attempt: number): number {
    const exponential = Math.min(WS_BACKOFF_MS * 2 ** (attempt - 1), 30_000);
    return Math.round(exponential * (0.5 + Math.random() * 0.5));
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

}
