/**
 * `useInvoices` — the one feature still on the legacy fetch path (ADR 0004, blueprint §8.1).
 *
 * This is the thinnest test file in `features/`, and that is the honest state of the code: the
 * migration to `InvoicesEndpoint` is about 85% done and stalled, and invoices is the holdout.
 * What is asserted here is the *consequence* of that, not a pretence that it is fine:
 *
 *  - the request goes out through `api/legacy/legacy-query.ts` (a `useEffect` fetch with its
 *    own loading state), so it does not participate in TanStack invalidation;
 *  - its errors bypass `error-mapper.ts` entirely, arriving as bare `Error` objects with a
 *    `status` property rather than as `ConsoleApiError` subclasses. `legacyStatus()` is how the
 *    hook recovers the status it would otherwise have had.
 *
 * When the migration lands, this file should get considerably longer.
 */
import { describe, expect, it } from 'vitest';

import { ConsoleApiError } from '@api/errors';
import { openInvoiceCount, useInvoices } from '@features/invoices/useInvoices';
import { makeInvoice, makePage } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the legacy read', () => {
  it('fetches /v1/invoices and returns the rows', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useInvoices());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useInvoices({ status: 'open', limit: 10 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const { result } = renderHookWithProviders(() => useInvoices());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('_source, the arc-MIG marker', () => {
  it('marks an unmigrated invoice as legacy', async () => {
    const { result } = renderHookWithProviders(() => useInvoices());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    expect(result.current.rows.every((row) => row._source === 'legacy')).toBe(true);
  });

  it('marks a migrated invoice as ledger-owned', async () => {
    server.use(
      http.get(url('/invoices'), () =>
        HttpResponse.json(makePage([makeInvoice({ migrated_to_ledger: true })])),
      ),
    );

    const { result } = renderHookWithProviders(() => useInvoices());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.rows[0]?._source).toBe('ledger');
  });

  it('flags a mixed page — the state the ledger_owns_invoices dry-run produces', async () => {
    server.use(
      http.get(url('/invoices'), () =>
        HttpResponse.json(
          makePage([
            makeInvoice({ id: 'inv_legacy', migrated_to_ledger: false }),
            makeInvoice({ id: 'inv_ledger', migrated_to_ledger: true }),
          ]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useInvoices());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });
    expect(result.current.isMixedSource).toBe(true);
  });

  it('is not mixed when every row comes from the same side', async () => {
    const { result } = renderHookWithProviders(() => useInvoices());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });
    expect(result.current.isMixedSource).toBe(false);
  });
});

describe('errors bypass the ConsoleApiError hierarchy', () => {
  it('surfaces a bare Error, not a ConsoleApiError subclass', async () => {
    server.use(errorHandler('get', '/invoices', 500, 'internal_error', 'Biller exploded'));

    const { result } = renderHookWithProviders(() => useInvoices());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.isUpstreamDown).toBe(false);
  });
});

describe('openInvoiceCount', () => {
  it('counts only the open invoices', async () => {
    const { result } = renderHookWithProviders(() => useInvoices());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    expect(openInvoiceCount(result.current.rows)).toBe(1);
  });

  it('is zero for an empty list', () => {
    expect(openInvoiceCount([])).toBe(0);
  });
});
