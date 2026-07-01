/**
 * `useInvoices(q)` — `GET /v1/invoices` (api-surface.md §12).
 *
 * The one contracted hook in this console that is not backed by TanStack Query. It wraps
 * `useLegacyQuery`, which is a `useEffect` fetch with its own loading state, so:
 *  - there is no cache, no dedupe and no background refresh;
 *  - `refetch()` is the only way to see a change;
 *  - errors are bare `Error`s from `legacy-errors.ts`, not `ConsoleApiError`s.
 *
 * TODO(rrefactor): swap for `InvoicesEndpoint` + `queryOptions`. The endpoint class has been
 * sitting there since ADR 0004 landed. PAY-1902.
 */
import { useMemo } from 'react';

import type { Invoice, InvoiceStatus, Paginated } from '@payzeno/contracts';

import { useLegacyQuery } from '@api/legacy/legacy-query';
import { legacyStatus } from '@api/legacy/legacy-errors';
import type { InvoiceRow } from '@/types/view-models';

import { toLegacyParams } from './invoices.queries';
import type { LegacyInvoiceQuery } from './invoices.queries';

export interface UseInvoicesResult {
  rows: InvoiceRow[];
  hasMore: boolean;
  /** True while the `ledger_owns_invoices` dry-run has both sources in the same list. */
  isMixedSource: boolean;
  isLoading: boolean;
  error: Error | null;
  isUpstreamDown: boolean;
  refetch: () => void;
}

/**
 * arc MIG: `_source` is derived from `migrated_to_ledger`, not sent by the API. The column it
 * drives was added for the dry-run, removed when the dry-run was rolled back, and added again
 * when it restarted.
 */
function toRow(invoice: Invoice): InvoiceRow {
  return {
    ...invoice,
    _selected: false,
    _source: invoice.migrated_to_ledger ? 'ledger' : 'legacy',
  };
}

export function useInvoices(q?: LegacyInvoiceQuery): UseInvoicesResult {
  const params = toLegacyParams(q);
  const { data, isLoading, error, refetch } = useLegacyQuery<Paginated<Invoice>>('/invoices', {
    query: params,
  });

  const rows = useMemo(() => (data?.data ?? []).map(toRow), [data]);

  const isMixedSource = useMemo(() => {
    const sources = new Set(rows.map((row) => row._source));
    return sources.size > 1;
  }, [rows]);

  return {
    rows,
    hasMore: data?.has_more ?? false,
    isMixedSource,
    isLoading,
    error,
    // 502 from payzeno-api means the billing-legacy circuit breaker tripped.
    isUpstreamDown: legacyStatus(error) === 502,
    refetch,
  };
}

/** Convenience for the open-invoice count the dashboard shows. */
