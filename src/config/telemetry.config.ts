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

/** 13-19 digits, optionally split by spaces or dashes. */
const PAN_CANDIDATE = /\b(?:\d[ -]*?){13,19}\b/g;

/**
 * Luhn check. Without it every order id and every `network_transaction_id` in a breadcrumb gets
 * mangled into `[redacted]` and the traces become useless, which is how the first version of
 * this file got reverted.
 */
export function isLuhnValid(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let double = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    const char = digits[i];
    if (char === undefined) return false;
    let digit = char.charCodeAt(0) - 48;
    if (digit < 0 || digit > 9) return false;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

function isDenylisted(key: string): boolean {
  return DENYLISTED_FIELDS.includes(key.toLowerCase());
}

/**
 * Deep-scrub an arbitrary value. Cycles are cut with a seen-set: Sentry contexts routinely
 * carry React fibers, which are cyclic, and a naive walk blows the stack.
 */
export function scrubValue(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (typeof value === 'string') return scrubPan(value);
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isDenylisted(key) ? REDACTED : scrubValue(item, seen);
  }
  return out;
}

/**
 * `beforeSend`. Drops request/response bodies wholesale, then scrubs whatever is left.
 *
 * Returning `null` discards the event; we only do that for events that carry a body we cannot
 * prove is clean.
 */
export function beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
  if (event.request) {
    // A body is never worth the risk. Keep method and URL only.
    delete event.request.data;
    delete event.request.cookies;
    if (event.request.headers) {
      event.request.headers = scrubValue(event.request.headers) as Record<string, string>;
    }
    if (typeof event.request.url === 'string') {
      event.request.url = scrubPan(event.request.url);
    }
  }

  if (event.extra) {
    event.extra = scrubValue(event.extra) as Record<string, unknown>;
  }
  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as NonNullable<ErrorEvent['contexts']>;
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
      ...crumb,
      message: typeof crumb.message === 'string' ? scrubPan(crumb.message) : crumb.message,
      data: crumb.data ? (scrubValue(crumb.data) as Record<string, unknown>) : crumb.data,
    }));
  }
  if (event.message) {
    event.message = scrubPan(event.message);
  }

  return event;
}

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
