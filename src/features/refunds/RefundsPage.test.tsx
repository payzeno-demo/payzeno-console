/**
 * `RefundsPage`.
 */
import { describe, expect, it } from 'vitest';

import { RefundsPage } from '@features/refunds/RefundsPage';
import { makePage, makeRefund } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the page', () => {
  it('renders its heading and description', async () => {
    renderWithProviders(<RefundsPage />, { route: '/refunds' });

    expect(await screen.findByRole('heading', { name: 'Refunds' })).toBeInTheDocument();
    expect(screen.getByText('Every refund you have issued, newest first.')).toBeInTheDocument();
  });

  it('offers a CSV export', async () => {
    renderWithProviders(<RefundsPage />, { route: '/refunds' });

    expect(await screen.findByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
  });
});

describe('the filters', () => {
  it('offers a charge-id box', async () => {
    renderWithProviders(<RefundsPage />, { route: '/refunds' });

    expect(await screen.findByLabelText('Charge')).toBeInTheDocument();
  });

});
