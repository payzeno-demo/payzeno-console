/**
 * `InvoicesEndpoint`.
 *
 * A note on why this file is thinner than its siblings, and why that is not an oversight:
 * `features/invoices` does **not** use this class. It still goes through
 * `src/api/legacy/fetch-json.ts` (ADR 0004, blueprint §8.1), so this endpoint is the migrated
 * shape waiting for a caller. It is exercised here so the eventual migration is a one-line
 * change in `invoices.queries.ts` rather than a discovery exercise.
 */
import { describe, expect, it } from 'vitest';

import { ApiClient } from '@api/client';
import { ResourceEndpoint } from '@api/endpoints/base';
import { InvoicesEndpoint } from '@api/endpoints/invoices.endpoint';
import { NotFoundApiError } from '@api/errors';
import { makeInvoice } from '@/test/factories';
import { errorHandler, recordRequests, server } from '@/test/msw/server';

function endpoint(): InvoicesEndpoint {
  return new InvoicesEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly, even though nothing calls it yet', () => {
    expect(Object.getPrototypeOf(InvoicesEndpoint)).toBe(ResourceEndpoint);
  });
});

describe('GET /v1/invoices', () => {
  it('lists invoices', async () => {
    const page = await endpoint().list();

    expect(page.data).toHaveLength(2);
    expect(page.data.map((invoice) => invoice.status)).toEqual(['open', 'paid']);
  });

  it('listOpen pins the status the outstanding-total column sums over', async () => {
    const recorder = recordRequests();
    await endpoint().listOpen({ limit: 100 });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('status=open');
    expect(request?.url).toContain('limit=100');
  });
});

describe('GET /v1/invoices/:invoiceId', () => {
  it('maps a missing invoice onto NotFoundApiError', async () => {
    server.use(errorHandler('get', '/invoices/:invoiceId', 404, 'not_found'));

    await expect(endpoint().get('inv_missing')).rejects.toBeInstanceOf(NotFoundApiError);
  });
});

describe('isLedgerOwned — the arc-MIG cutover flag', () => {
  it('is false while the legacy biller still owns the invoice', () => {
    const invoice = makeInvoice({ migrated_to_ledger: false });

    expect(endpoint().isLedgerOwned(invoice)).toBe(false);
  });

  it('is true once the ledger dry-run has claimed it', () => {
    const invoice = makeInvoice({ migrated_to_ledger: true });

    expect(endpoint().isLedgerOwned(invoice)).toBe(true);
  });

});
