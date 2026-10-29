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

  it('shows an empty state when the merchant has taken no payments', async () => {
    server.use(http.get(url('/payment_intents'), () => HttpResponse.json(makePage([]))));

    renderWithProviders(<PaymentsPage />, { route: '/payments' });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(1);
  });
});

describe('URL-driven filters', () => {
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

  it('sends no status parameter for "all"', async () => {
    const recorder = recordRequests();
    renderWithProviders(<PaymentsPage />, { route: '/payments?status=all' });

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('/payment_intents')),
      ).toBe(true);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/payment_intents'),
    );
    recorder.stop();

    expect(request?.url).not.toContain('status=');
  });
});

describe('failure', () => {
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

// ---------------------------------------------------------------------------
// RFC platform-v2 §8: the "Reviews" view
// ---------------------------------------------------------------------------

describe('the reviews view', () => {
  it('lists open reviews by default, read-only, linked to their payments', async () => {
    const recorder = recordRequests();
    renderWithProviders(<PaymentsPage />, { route: '/payments?view=reviews' });

    const table = await screen.findByRole('table', {
      name: 'Payments held for review by Payzeno risk, newest first',
    });
    await waitFor(() => expect(table.querySelectorAll('tbody tr')).toHaveLength(1));
    expect(table.querySelector('a[href="/payments/pi_01HW0RTPAYMENTINTENT0001"]')).not.toBeNull();
    expect(recorder.requests.some((request) => request.url.includes('/reviews?') && request.url.includes('status=open'))).toBe(true);
    // The payments list is not fetched while the reviews view is showing.
    expect(recorder.requests.some((request) => request.url.includes('/payment_intents'))).toBe(false);
    recorder.stop();
  });

  it('switches views from the segmented control', async () => {
    const { user } = renderWithProviders(<PaymentsPage />, { route: '/payments' });

    await user.click(await screen.findByRole('radio', { name: 'Reviews' }));

    expect(
      await screen.findByRole(
        'table',
        { name: 'Payments held for review by Payzeno risk, newest first' },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
  });

  it('badges a held payment in the main list', async () => {
    server.use(
      http.get(url('/payment_intents'), () =>
        HttpResponse.json(
          makePage([
            makePaymentIntent({ status: 'requires_capture', review_id: 'rv_01HW0RTREVIEW0000000001' }),
          ]),
        ),
      ),
    );

    renderWithProviders(<PaymentsPage />, { route: '/payments' });

    expect(await screen.findByText('Held for review')).toBeInTheDocument();
  });
});
