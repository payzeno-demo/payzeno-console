/**
 * Telemetry.
 *
 * `main.tsx` calls `initTelemetry()` before it renders. Everything else in the repo goes
 * through `captureError` / `trackEvent` / `addBreadcrumb` — nobody imports `@sentry/react`
 * directly, so the redaction rules in `config/telemetry.config.ts` cannot be bypassed.
 *
 * arc PCI: dhotfix owns this file jointly with tflexbox. Rule, from ADR 0003 — **no request or
 * response body ever reaches this module.** Pass ids, statuses and codes.
 */
import * as Sentry from '@sentry/react';

import { runtimeConfig } from '@config/runtime';
import { scrubPan, sentryOptions } from '@config/telemetry.config';

let initialised = false;

/** Idempotent. `main.tsx` calls it once; tests call it never. */
export function initTelemetry(): void {
  if (initialised) return;
  if (!runtimeConfig.sentryDsn) {
    initialised = true;
    return;
  }

  Sentry.init(sentryOptions());
  Sentry.setTag('console.build', runtimeConfig.buildSha);
  Sentry.setTag('console.environment', runtimeConfig.environment);
  initialised = true;
}

/** Whether telemetry is actually reporting. `false` in local dev, where the DSN is empty. */
export function isTelemetryEnabled(): boolean {
  return initialised && runtimeConfig.sentryDsn !== null;
}

export interface ErrorContext {
  /** `X-Request-Id` of the failing call, when there was one. */
  requestId?: string;
  /** The contracts `ErrorCode`, when the failure came back as an `ApiError`. */
  code?: string;
  /** Route path — never the full URL, which can carry a resource id in a query string. */
  route?: string;
  feature?: string;
}

/**
 * Report an error.
 *
 * `context` values are scrubbed on the way in as well as in `beforeSend`; belt and braces,
 * because `beforeSend` only sees what Sentry decided to serialise.
 */
export function captureError(error: unknown, context: ErrorContext = {}): void {
  if (!isTelemetryEnabled()) return;

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') scope.setTag(key, scrubPan(value));
    }
    Sentry.captureException(error);
  });
}

/** A named user action worth seeing in the trail before a crash. */
export function trackEvent(name: string, data: Record<string, string | number | boolean> = {}): void {
  if (!isTelemetryEnabled()) return;

  Sentry.addBreadcrumb({
    category: 'console.action',
    level: 'info',
    message: name,
    data,
  });
}

/** HTTP breadcrumb. Method, path template and status — never the body, never the query. */
export function addRequestBreadcrumb(
  method: string,
  pathTemplate: string,
  status: number,
  durationMs: number,
): void {
  if (!isTelemetryEnabled()) return;

  Sentry.addBreadcrumb({
    category: 'console.http',
    level: status >= 500 ? 'error' : status >= 400 ? 'warning' : 'info',
    message: `${method} ${pathTemplate}`,
    data: { status, durationMs },
  });
}

/**
 * Associate the session with a user.
 *
 * Id and merchant only. `sendDefaultPii` is false and the email is deliberately not sent —
 * dhotfix removed it in PAY-1811 and the review comment is the canonical statement of the
 * rule.
 */
export function identifySession(userId: string, merchantId: string, role: string): void {
  if (!isTelemetryEnabled()) return;

  Sentry.setUser({ id: userId });
  Sentry.setTag('merchant.id', merchantId);
  Sentry.setTag('user.role', role);
}

/** Called on logout so the next session on a shared machine is not attributed to the last one. */
export function clearSession(): void {
  if (!isTelemetryEnabled()) return;
  Sentry.setUser(null);
}
