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
