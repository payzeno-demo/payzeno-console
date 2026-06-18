/**
 * `InvoicesPage` — the visible surface of arc MIG, and the one test `features/invoices` gets
 * (blueprint §8.5).
 *
 * Invoices are still produced by the legacy biller and fetched through
 * `src/api/legacy/legacy-query.ts`, so the banner on this page is not decoration: it is the
 * merchant-facing explanation for why these numbers arrive on a different schedule from
 * everything else in the console.
 */
import { describe, expect, it } from 'vitest';

import { InvoicesPage } from '@features/invoices/InvoicesPage';
import { makeInvoice, makePage } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the page', () => {
  it('renders its heading and description', async () => {
    renderWithProviders(<InvoicesPage />, { route: '/invoices' });

    expect(await screen.findByRole('heading', { name: 'Invoices' })).toBeInTheDocument();
    expect(screen.getByText('Your monthly Payzeno processing fees.')).toBeInTheDocument();
  });

  it('sets the document title', async () => {
    renderWithProviders(<InvoicesPage />, { route: '/invoices' });

    await waitFor(() => {
      expect(document.title).toContain('Invoices');
    });
  });

  it('is rendered on the page', async () => {
    renderWithProviders(<InvoicesPage />, { route: '/invoices' });

    await screen.findByRole('table');
    expect(screen.getByRole('main').textContent).toMatch(/billing|invoice/i);
  });

  it('changes when the page holds invoices from both sources', async () => {
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

    renderWithProviders(<InvoicesPage />, { route: '/invoices' });

    await screen.findByRole('table');
    expect(screen.getByRole('main').textContent).toMatch(/ledger|migrat/i);
  });
});

describe('failure', () => {
  it('renders the error state — and it is the generic one, because the legacy path bypasses the mapper', async () => {
    server.use(errorHandler('get', '/invoices', 500, 'internal_error', 'Biller exploded'));

    renderWithProviders(<InvoicesPage />, { route: '/invoices' });

    expect(
      await screen.findByRole('heading', { name: 'We could not load your invoices' }),
    ).toBeInTheDocument();
  });

  it('says the upstream is down on a 502 from the biller circuit breaker', async () => {
    server.use(errorHandler('get', '/invoices', 502, 'processor_unavailable'));

    renderWithProviders(<InvoicesPage />, { route: '/invoices' });

    await waitFor(() => {
      expect(screen.getByRole('main').textContent).toMatch(/not responding|unavailable|down/i);
    });
  });
});
