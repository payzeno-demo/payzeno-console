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
  it('renders a labelled search region', async () => {
    renderWithProviders(<RefundsPage />, { route: '/refunds' });

    expect(await screen.findByRole('search', { name: 'Refund filters' })).toBeInTheDocument();
  });

  it('offers a charge-id box', async () => {
    renderWithProviders(<RefundsPage />, { route: '/refunds' });

    expect(await screen.findByLabelText('Charge')).toBeInTheDocument();
  });

  it('reads the status filter out of the URL', async () => {
    const recorder = recordRequests();
    renderWithProviders(<RefundsPage />, { route: '/refunds?status=succeeded' });

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('status=succeeded')),
      ).toBe(true);
    });
    recorder.stop();
  });

  it('debounces typing rather than firing a request per keystroke', async () => {
    const recorder = recordRequests();
    const { user } = renderWithProviders(<RefundsPage />, { route: '/refunds' });

    const field = await screen.findByLabelText('Charge');
    await user.type(field, 'ch_1');

    const withCharge = recorder.requests.filter((request) =>
      request.url.includes('charge_id='),
    );
    recorder.stop();

    expect(withCharge.length).toBeLessThan(4);
  });
});

describe('the table', () => {
});
