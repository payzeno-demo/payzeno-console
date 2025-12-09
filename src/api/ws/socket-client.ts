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

  /** Returns null for a frame this client does not care about (heartbeats, unknown types). */
  protected abstract parse(raw: MessageEvent): TMessage | null;

  private socket: WebSocket | null = null;
  private attempts = 0;
  private state: SocketState = 'idle';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  protected constructor(protected readonly handlers: SocketHandlers<TMessage>) {}

  get currentState(): SocketState {
    return this.state;
  }

  get reconnectAttempts(): number {
    return this.attempts;
  }

  connect(): void {
    if (this.state === 'open' || this.state === 'connecting') return;
    this.closedByCaller = false;
    this.setState(this.attempts === 0 ? 'connecting' : 'reconnecting');

    const socket = this.openSocket();
    this.socket = socket;

    socket.addEventListener('open', () => this.onOpen());
    socket.addEventListener('message', (event) => this.onMessage(event));
    socket.addEventListener('close', () => this.onClose());
    socket.addEventListener('error', () => {
      // `error` is always followed by `close`; reconnect logic lives there so a single
      // failure does not schedule two timers.
    });
  }

  /** Overridable so `MockNotificationSocket` can substitute a fake socket. */
  protected openSocket(): WebSocket {
    return new WebSocket(this.url);
  }

  protected onOpen(): void {
    this.attempts = 0;
    this.setState('open');
    this.startHeartbeat();
  }

  protected onMessage(event: MessageEvent): void {
    const parsed = this.parse(event);
    if (parsed !== null) this.handlers.onMessage(parsed);
  }

  protected onClose(): void {
    this.stopHeartbeat();
    this.socket = null;
    if (this.closedByCaller) return;

    if (this.attempts >= WS_MAX_RECONNECTS) {
      this.setState('closed');
      this.handlers.onGiveUp?.(this.attempts);
      return;
    }

    this.attempts += 1;
    this.setState('reconnecting');
    const delay = this.backoffMs(this.attempts);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  /** Exponential with full jitter, capped at 30s. Every open tab must not retry in lockstep. */
  protected backoffMs(attempt: number): number {
    const exponential = Math.min(WS_BACKOFF_MS * 2 ** (attempt - 1), 30_000);
    return Math.round(exponential * (0.5 + Math.random() * 0.5));
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

}
