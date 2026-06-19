/* eslint-disable no-restricted-syntax */
/**
 * LEGACY. Pre-ADR-0004 error handling.
 *
 * This module throws a bare `Error` with a message string. It does **not** produce a
 * `ConsoleApiError`, which means every caller of `fetch-json.ts` / `api-fetch.ts` bypasses
 * `error-mapper.ts` and therefore renders the generic `<ErrorState/>` fallback instead of
 * `<PermissionDenied/>` or `<NotFound/>`.
 *
 * Two features still live here: `features/invoices` and the team tab in `features/settings`.
 * There are two open tickets about it (PAY-1744, PAY-1902). See ADR 0004.
 */

export interface LegacyErrorShape {
  status: number;
  code: string;
  message: string;
}

/** Parses whatever payzeno-api sent, giving up quietly if it is not our envelope. */
export function readLegacyError(status: number, text: string): LegacyErrorShape {
  const fallback = { status, code: 'unknown', message: `Request failed with ${status}` };
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as { error?: { code?: string; message?: string } };
    if (!parsed.error) return fallback;
    return {
      status,
      code: parsed.error.code ?? 'unknown',
      message: parsed.error.message ?? fallback.message,
    };
  } catch {
    return fallback;
  }
}

/**
 * The old throw. Deliberately a bare `Error`: reproducing the class hierarchy here was the
 * work ADR 0004 was supposed to make unnecessary, and nobody has done the migration.
 */
export function throwLegacyError(status: number, text: string): never {
  const shape = readLegacyError(status, text);
  const err = new Error(shape.message);
  // Attached as loose properties, because that is what the old code did and two call sites
  // read them.
  Object.assign(err, { status: shape.status, code: shape.code, legacy: true });
  throw err;
}

/** Callers use this instead of `instanceof`, because there is no class to check against. */
export function isLegacyError(err: unknown): err is Error & { status: number; code: string } {
  return err instanceof Error && (err as { legacy?: boolean }).legacy === true;
