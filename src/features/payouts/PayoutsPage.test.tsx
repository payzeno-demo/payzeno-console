/**
 * `PayoutsPage`.
 *
 * `payout.failed` is the one event the console surfaces directly (domain-model.md §9). The
 * page therefore has two banners with different urgencies — a live push while the page is open,
 * and a standing "these are still failed" summary — and the difference between them is
 * `role="alert"` versus `role="status"`.
 */
import { describe, expect, it } from 'vitest';

import { PayoutsPage } from '@features/payouts/PayoutsPage';
import { makePage, makePayout } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the page', () => {
  it('renders its heading and description', async () => {
    renderWithProviders(<PayoutsPage />, { route: '/payouts' });

    expect(await screen.findByRole('heading', { name: 'Payouts' })).toBeInTheDocument();
    expect(
      screen.getByText('Money on its way from your Payzeno balance to your bank.'),
    ).toBeInTheDocument();
  });

  it('is absent when every payout is healthy', async () => {
    server.use(
      http.get(url('/payouts'), () =>
        HttpResponse.json(makePage([makePayout({ status: 'paid' })])),
      ),
    );

    renderWithProviders(<PayoutsPage />, { route: '/payouts' });

    await screen.findByRole('table');
    expect(screen.queryByText('Failed payouts need attention')).not.toBeInTheDocument();
  });

  it('renders the error state instead of the table', async () => {
    server.use(errorHandler('get', '/payouts', 500, 'internal_error'));

    renderWithProviders(<PayoutsPage />, { route: '/payouts' });

    expect(
      await screen.findByRole('heading', { name: 'We could not load your payouts' }),
    ).toBeInTheDocument();
  });
});
