/**
 * Invoice fetching. **This file is the arc-MIG holdout.**
 *
 * Every other feature in this console reaches payzeno-api through a `ResourceEndpoint` and
 * TanStack Query. Invoices do not: they call `src/api/legacy/fetch-json.ts` directly, and the
 * list is driven by `src/api/legacy/legacy-query.ts`, a pre-TanStack `useEffect` fetch with
 * its own loading state.
 *
 * `InvoicesEndpoint` exists, works, and has tests. Nothing is blocking the migration except
 * that the invoice shape is owned by payzeno-billing-legacy, which is arc MIG's problem, which
 * is not the Web team's problem. Four quarters running.
 *
 * What that costs, concretely:
 *  - invoices never participate in `queryClient.invalidateQueries`;
 *  - the CSRF header is built here, slightly differently from `api/http/csrf.ts`;
 *  - a 403 throws a bare `Error`, so the page renders the generic fallback rather than
 *    `<PermissionDenied/>`.
 *
 * See docs/adr/0004-endpoint-classes-over-fetch-helpers.md. PAY-1902.
 */
import type { Invoice, InvoiceStatus, Paginated } from '@payzeno/contracts';

import { fetchJson } from '@api/legacy/fetch-json';
import { DEFAULT_PAGE_SIZE } from '@config/constants';

export interface LegacyInvoiceQuery {
  status?: InvoiceStatus;
  limit?: number;
  cursor?: string;
}

/** The query-string shape `fetch-json.ts` accepts — flat, string|number|undefined. */
export function toLegacyParams(q?: LegacyInvoiceQuery): Record<string, string | number | undefined> {
  return {
    limit: q?.limit ?? DEFAULT_PAGE_SIZE,
    status: q?.status,
    cursor: q?.cursor,
  };
}
