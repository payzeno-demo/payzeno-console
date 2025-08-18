/**
 * Vitest global setup — referenced from `vitest.config.ts::setupFiles`.
 *
 * Three jobs, in this order, and the order matters:
 *
 *  1. **Populate `import.meta.env` before any module reads it.** `src/config/env.ts` parses the
 *     seven `VITE_*` variables at module load and throws `EnvConfigError` when one is missing.
 *     Setup files are evaluated before the test module graph, so assigning here is the only
 *     point at which we can get in front of that. A test file that imports anything touching
 *     `@config/runtime` — which is nearly all of them — would otherwise fail at import time
 *     with a config error that says nothing about the test.
 *  2. **Install the jest-dom matchers**, so `toBeInTheDocument()` / `toHaveAccessibleName()`
 *     exist. Tal's a11y assertions are all written against those.
 *  3. **Run the MSW server for the whole run**, resetting handlers between tests so a
 *     `server.use(...)` override in one case cannot leak into the next.
 *
 * It also patches the three DOM APIs jsdom does not implement but Radix insists on
 * (`matchMedia`, `ResizeObserver`, `Element.prototype.scrollIntoView` + pointer capture).
 * Without them every `<Select>`, `<Dialog>` and `<Tabs>` test throws inside Radix rather than
 * inside our own component, which is a miserable way to spend an afternoon.
 */
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

/**
 * The console's seven build-time variables, at their local-development values.
 *
 * `VITE_PAYZENO_API_URL` is the base every MSW handler in `src/test/msw/handlers.ts` is
 * written against — change one and you must change the other.
 */
export const TEST_ENV: Readonly<Record<string, string>> = {
  VITE_PAYZENO_API_URL: 'http://localhost/v1',
  VITE_WS_URL: 'ws://localhost/ws/notifications',
  VITE_VAULT_PUBLIC_URL: 'http://localhost:8099/public',
  VITE_SENTRY_DSN: '',
  VITE_ENVIRONMENT: 'local',
  VITE_FEATURE_SETTLEMENT_EXPLORER: 'true',
  VITE_FEATURE_DISPUTE_EVIDENCE_V2: 'false',
};

Object.assign(import.meta.env, TEST_ENV);

// `vite.config.ts` injects these through `define`. Vitest does not run that plugin pass for
// the test graph, so `config/runtime.ts`'s `typeof __CONSOLE_VERSION__ === 'string'` guards
// would take the fallback branch. Declaring them here exercises the real branch instead.
Object.assign(globalThis, {
  __CONSOLE_VERSION__: '1.34.0-test',
  __BUILD_SHA__: 'testsha',
  __FORCE_MOCK_TRANSPORT__: false,
});

// ---------------------------------------------------------------------------
// jsdom gaps that Radix (Select, Dialog, Tabs, Popover, Toast) depends on.
// ---------------------------------------------------------------------------

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}

if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {};
}

if (typeof Element.prototype.hasPointerCapture !== 'function') {
  Element.prototype.hasPointerCapture = function hasPointerCapture(): boolean {
    return false;
  };
  Element.prototype.setPointerCapture = function setPointerCapture(): void {};
  Element.prototype.releasePointerCapture = function releasePointerCapture(): void {};
}

// `lib/download.ts` builds an object URL for the CSV export. jsdom has neither side.
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:payzeno-test';
  URL.revokeObjectURL = () => undefined;
}

// ---------------------------------------------------------------------------
// WebSocket. jsdom's implementation opens a *real* TCP connection, so
// `NotificationSocket` would dial ws://localhost:80 from every render that mounts
// `NotificationProvider` — which is every render that goes through `src/test/render.tsx`.
// The result is a stream of ECONNREFUSED noise and a live reconnect timer per test file.
//
// `FakeWebSocket` replaces it with something a test can drive: `useNotificationStream.test.ts`
// asserts open/message/reconnect by pushing frames through `FakeWebSocket.last()`.
// ---------------------------------------------------------------------------

type SocketListener = (event: Event | MessageEvent | CloseEvent) => void;

export class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  /** Every instance constructed since the last `reset()`, oldest first. */
  static instances: FakeWebSocket[] = [];

  static last(): FakeWebSocket {
    const socket = FakeWebSocket.instances.at(-1);
    if (!socket) throw new Error('No FakeWebSocket has been constructed yet.');
    return socket;
  }

  static reset(): void {
    FakeWebSocket.instances = [];
  }

  readonly CONNECTING = FakeWebSocket.CONNECTING;
  readonly OPEN = FakeWebSocket.OPEN;
  readonly CLOSING = FakeWebSocket.CLOSING;
  readonly CLOSED = FakeWebSocket.CLOSED;

  readyState: number = FakeWebSocket.CONNECTING;

  /** Frames the client sent — the heartbeat assertion reads this. */
  readonly sent: string[] = [];

  private readonly listeners = new Map<string, SocketListener[]>();

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: SocketListener): void {
    const bucket = this.listeners.get(type) ?? [];
    bucket.push(listener);
    this.listeners.set(type, bucket);
  }

  removeEventListener(type: string, listener: SocketListener): void {
    const bucket = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      bucket.filter((candidate) => candidate !== listener),
    );
  }

  send(payload: string): void {
    this.sent.push(payload);
  }

  close(): void {
    if (this.readyState === FakeWebSocket.CLOSED) return;
    this.readyState = FakeWebSocket.CLOSED;
    this.emit('close', new Event('close'));
  }

  // --- test-side drivers -----------------------------------------------------

  /** Complete the handshake. */
  simulateOpen(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.emit('open', new Event('open'));
  }

  /** Deliver a frame. Objects are JSON-encoded, matching the real wire format. */
  simulateMessage(data: unknown): void {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.emit('message', { data: payload } as MessageEvent);
  }

  /** Drop the connection from the server side, which is what triggers a reconnect. */
  simulateClose(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.emit('close', new Event('close'));
  }

  simulateError(): void {
    this.emit('error', new Event('error'));
  }

  private emit(type: string, event: Event | MessageEvent): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

Object.assign(globalThis, { WebSocket: FakeWebSocket });

// ---------------------------------------------------------------------------
// MSW lifecycle. Imported lazily so the env assignment above lands first — `handlers.ts`
// reads `import.meta.env.VITE_PAYZENO_API_URL` at module scope to build its URLs.
// ---------------------------------------------------------------------------

const { server } = await import('./msw/server');

beforeAll(() => {
  // `error` and not `warn`: a hook test that hits a route with no handler is a test that is
  // silently asserting nothing, and we would rather it fail loudly.
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  FakeWebSocket.reset();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});
