/**
 * Client-side (non-HTTP) failures.
 *
 * The HTTP branch lives in `src/api/errors.ts` (`ConsoleApiError` and its nine subclasses) and
 * is constructed only by `api/http/error-mapper.ts`. This file is the *other* branch: things
 * that go wrong in the browser without a response ever arriving — a WebSocket that gave up, a
 * CSV cell that cannot be serialised, a vault POST the browser made directly, a missing build
 * variable.
 *
 * Both branches root at `PayzenoError` from `@payzeno/contracts`, which is what keeps the
 * inheritance chain crossing the repo boundary.
 */
import type { ErrorCode } from '@payzeno/contracts';
import { PayzenoError } from '@payzeno/contracts/errors';

/**
 * Base for everything that fails without an HTTP status.
 *
 * `code` is the frozen contracts vocabulary (it has to be — `PayzenoError` declares it), and
 * `clientCode` is the console-local discriminator that UI branches actually switch on.
 * `recoverable` says whether retrying the same action could plausibly work.
 */
export abstract class ConsoleClientError extends PayzenoError {
  abstract readonly clientCode: string;
  abstract readonly recoverable: boolean;

  /** Human-facing one-liner. Never contains a request body — see ADR 0003. */
  get displayMessage(): string {
    return this.message;
  }
}

/** The notification socket exhausted `MAX_RECONNECTS` and stopped trying. */
export class NotificationStreamError extends ConsoleClientError {
  readonly code: ErrorCode = 'internal_error';
  readonly httpStatus = 0;
  readonly clientCode = 'notification_stream_closed';
  readonly recoverable = true;

  constructor(
    readonly attempts: number,
    /** The socket's last close code, when the browser gave us one. */
    readonly lastCloseCode: number | null = null,
  ) {
    super(`Notification stream closed after ${attempts} reconnect attempts`, {
      attempts,
      lastCloseCode,
    });
  }
}

/** `lib/csv.ts` hit a cell it cannot turn into a string without lying about it. */
export class CsvExportError extends ConsoleClientError {
  readonly recoverable = true;

  constructor(
    message: string,
    readonly vaultReference: string | null = null,
  ) {
    super(message, { vaultReference });
  }
}

/**
 * A required `VITE_*` variable was missing or malformed at boot.
 *
 * Thrown at module load from `config/env.ts`, which `main.tsx` imports before it renders
 * anything. A console that boots without an API URL and shows an empty dashboard is worse
 * than one that refuses to start.
 */
export class EnvConfigError extends ConsoleClientError {
  readonly code: ErrorCode = 'internal_error';
  readonly httpStatus = 0;
  readonly recoverable = false;

  constructor(
    readonly issues: ReadonlyArray<{ path: string; message: string }>,
  ) {
    super(
      `Invalid console configuration: ${issues.map((i) => `${i.path} (${i.message})`).join(', ')}`,
      { issueCount: issues.length },
    );
  }
}

/** Narrowing helper used by `ErrorBoundary` and by the toast layer. */
export function isConsoleClientError(err: unknown): err is ConsoleClientError {
  return err instanceof ConsoleClientError;
}

/** True when the user pressing "try again" has any chance of a different outcome. */
export function isRecoverable(err: unknown): boolean {
  return isConsoleClientError(err) ? err.recoverable : false;
}
