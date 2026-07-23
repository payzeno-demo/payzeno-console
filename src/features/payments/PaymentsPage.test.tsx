/**
 * `PaymentsPage`. Filters live in the URL, not in component state — a merchant sending a
 * colleague a link to "the payments that need capturing" is the whole reason for that.
 */
import { describe, expect, it } from 'vitest';

import { PaymentsPage } from '@features/payments/PaymentsPage';
import { makePage, makePaymentIntent } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the page', () => {
  it('renders its heading and description', async () => {
    renderWithProviders(<PaymentsPage />, { route: '/payments' });

    expect(await screen.findByRole('heading', { name: 'Payments' })).toBeInTheDocument();
    expect(
      screen.getByText('Every payment intent your integration has created.'),
    ).toBeInTheDocument();
  });

  it('sets the document title', async () => {
    renderWithProviders(<PaymentsPage />, { route: '/payments' });

    await waitFor(() => {
      expect(document.title).toContain('Payments');
    });
  });

  it('renders a labelled filter region', async () => {
    renderWithProviders(<PaymentsPage />, { route: '/payments' });

    expect(await screen.findByRole('search', { name: 'Payment filters' })).toBeInTheDocument();
  });
});

describe('the table', () => {
  it('renders a row per intent', async () => {
    renderWithProviders(<PaymentsPage />, { route: '/payments' });

    const table = await screen.findByRole('table');
    await waitFor(() => {
      expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
    });
  });

  it('renders the status of each intent', async () => {
    renderWithProviders(<PaymentsPage />, { route: '/payments' });

    expect(await screen.findByText('requires capture')).toBeInTheDocument();
    expect(screen.getByText('succeeded')).toBeInTheDocument();
  });

  it('sends the status from the query string', async () => {
    const recorder = recordRequests();
    renderWithProviders(<PaymentsPage />, { route: '/payments?status=requires_capture' });

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('status=requires_capture')),
      ).toBe(true);
    });
    recorder.stop();
  });

  it('sends the customer reference from the query string', async () => {
    const recorder = recordRequests();
    renderWithProviders(<PaymentsPage />, { route: '/payments?customer=cust-8814' });

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('customer_reference=cust-8814')),
      ).toBe(true);
    });
    recorder.stop();
  });

  it('sends the cursor from the query string', async () => {
    const recorder = recordRequests();
    renderWithProviders(<PaymentsPage />, { route: '/payments?cursor=cur_page_two' });

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('cursor=cur_page_two')),
      ).toBe(true);
    });
    recorder.stop();
  });

  it('renders the error state instead of the table', async () => {
    server.use(errorHandler('get', '/payment_intents', 500, 'internal_error'));

    renderWithProviders(<PaymentsPage />, { route: '/payments' });

    expect(
      await screen.findByRole('heading', { name: 'We could not load your payments' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('a payment awaiting customer action', () => {
  it('appears in the list with its status', async () => {
    server.use(
      http.get(url('/payment_intents'), () =>
        HttpResponse.json(
          makePage([makePaymentIntent({ status: 'requires_action' })]),
        ),
      ),
    );

    renderWithProviders(<PaymentsPage />, { route: '/payments' });

    expect(await screen.findByText('requires action')).toBeInTheDocument();
  });
});
