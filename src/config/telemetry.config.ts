/**
 * Sentry options, including the redaction pass.
 *
 * arc PCI. This mirrors payzeno-api's `RedactionInterceptor` field denylist — if the two drift,
 * the console becomes the leak. dhotfix reviews every change to this file and has rejected two
 * PRs for adding `console.debug(body)` upstream of it.
 *
 * Rules:
 *  - never send a request or response body;
 *  - scrub any key in `DENYLISTED_FIELDS`, at any depth;
 *  - scrub anything that *looks* like a PAN, even in free text (Luhn-checked).
 */
import type { BrowserOptions, ErrorEvent, EventHint } from '@sentry/react';

import { runtimeConfig } from './runtime';

/** Field names that never leave the browser. Mirrors domain-model.md §11.2. */
export const DENYLISTED_FIELDS: ReadonlyArray<string> = [
  'card_number',
  'cardnumber',
  'pan',
  'cvv',
  'cvc',
  'exp_month',
  'exp_year',
  'account_number',
  'routing_number',
  'iban',
  'sort_code',
  'client_secret',
  'api_key',
  'secret',
  'signing_secret',
  'password',
  'authorization',
  'cookie',
  'set-cookie',
  'x-payzeno-csrf',
];

const REDACTED = '[redacted]';

/** Options handed to `Sentry.init()` by `lib/telemetry.ts::initTelemetry`. */
export function sentryOptions(): BrowserOptions {
  return {
    dsn: runtimeConfig.sentryDsn ?? undefined,
    environment: runtimeConfig.environment,
    release: `payzeno-console@${runtimeConfig.consoleVersion}+${runtimeConfig.buildSha}`,
    // Production gets 10%; everywhere else we want every trace while we are still tuning.
    tracesSampleRate: runtimeConfig.environment === 'production' ? 0.1 : 1,
    sendDefaultPii: false,
    attachStacktrace: true,
    ignoreErrors: [...IGNORED_ERRORS],
    beforeSend,
  };
}
