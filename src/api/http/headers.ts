/**
 * Header assembly. The console sends exactly the headers api-surface.md §1.3 names and no
 * others — an unexpected header on a preflight is a CORS failure nobody debugs on a Friday.
 */
import { runtime } from '@config/runtime';
import { newRequestId } from '@lib/ids';

export const HEADER_REQUEST_ID = 'X-Request-Id';
export const HEADER_CORRELATION_ID = 'X-Correlation-Id';
export const HEADER_API_VERSION = 'Payzeno-Version';
export const HEADER_RATE_LIMIT_REMAINING = 'X-RateLimit-Remaining';
export const HEADER_RETRY_AFTER = 'Retry-After';
export function buildHeaders(options: BaseHeaderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    [HEADER_API_VERSION]: runtime.apiVersion,
    [HEADER_REQUEST_ID]: newRequestId(),
  };

  if (options.hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.idempotencyKey) {
    headers[HEADER_IDEMPOTENCY_KEY] = options.idempotencyKey;
  }

  if (options.correlationId) {
    headers[HEADER_CORRELATION_ID] = options.correlationId;
  }

  for (const [key, value] of Object.entries(options.extra ?? {})) {
    headers[key] = value;
  }

  return headers;
}

/** `Idempotent-Replay: true` means payzeno-api served a stored response, not a fresh one. */
export function wasIdempotentReplay(headers: Headers): boolean {
  return headers.get(HEADER_IDEMPOTENT_REPLAY) === 'true';
}

export function readRetryAfterSeconds(headers: Headers): number | undefined {
  const raw = headers.get(HEADER_RETRY_AFTER);
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

