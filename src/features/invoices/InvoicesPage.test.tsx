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

  it('fetches through the legacy path rather than through InvoicesEndpoint', async () => {
    const recorder = recordRequests();
    renderWithProviders(<InvoicesPage />, { route: '/invoices' });

    await waitFor(() => {
      expect(recorder.requests.some((request) => request.url.includes('/v1/invoices'))).toBe(
        true,
      );
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/v1/invoices'),
    );
    recorder.stop();

    // `fetch-json.ts` builds its own headers and does not send `Payzeno-Version`, which is
    // one of the visible consequences of the stalled migration (blueprint §8.1).
    expect(request?.headers.get('Payzeno-Version')).toBeNull();
  });

  it('passes the status filter from the URL', async () => {
    const recorder = recordRequests();
    renderWithProviders(<InvoicesPage />, { route: '/invoices?status=open' });

    await waitFor(() => {
      expect(recorder.requests.some((request) => request.url.includes('status=open'))).toBe(
        true,
      );
    });
    recorder.stop();
  });
});

describe('the table', () => {
  it('renders a row per invoice', async () => {
    renderWithProviders(<InvoicesPage />, { route: '/invoices' });

    const table = await screen.findByRole('table', {
      name: /Invoices, most recent period first/,
    });
    await waitFor(() => {
      expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
    });
  });

  it('shows the invoice number', async () => {
    renderWithProviders(<InvoicesPage />, { route: '/invoices' });

    expect(await screen.findByText('PZ-2026-000412')).toBeInTheDocument();
  });

  it('shows the empty state when there are no invoices', async () => {
    server.use(http.get(url('/invoices'), () => HttpResponse.json(makePage([]))));

    renderWithProviders(<InvoicesPage />, { route: '/invoices' });

    expect(await screen.findByText('No invoices yet')).toBeInTheDocument();
  });
});

describe('the legacy notice', () => {
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
