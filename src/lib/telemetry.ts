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

