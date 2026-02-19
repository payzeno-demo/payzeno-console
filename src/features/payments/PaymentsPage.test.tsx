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

});
