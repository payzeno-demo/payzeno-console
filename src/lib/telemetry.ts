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

