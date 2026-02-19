/**
 * `BalancePage`.
 *
 * A negative balance blocks payouts (domain-model.md §8), so the alert on this page is the
 * only warning a merchant gets before a payout is refused. It has to appear, and it has to be
 * absent when the balance is healthy — a permanently-visible warning is a warning nobody reads.
 */
import { describe, expect, it } from 'vitest';

import { BalancePage } from '@features/balance/BalancePage';
import { makeBalance } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the page', () => {
  it('renders its heading', async () => {
    renderWithProviders(<BalancePage />, { route: '/balance' });

    expect(await screen.findByRole('heading', { name: 'Balance' })).toBeInTheDocument();
  });

  it('sets the document title', async () => {
    renderWithProviders(<BalancePage />, { route: '/balance' });

    await waitFor(() => {
      expect(document.title).toContain('Balance');
    });
  });

  it('offers a currency filter', async () => {
    renderWithProviders(<BalancePage />, { route: '/balance' });

    expect(await screen.findByRole('search', { name: 'Balance currency' })).toBeInTheDocument();
  });
});

describe('the read', () => {
  it('asks for the merchant default currency by default', async () => {
    const recorder = recordRequests();
    renderWithProviders(<BalancePage />, { route: '/balance' });

    await waitFor(() => {
      expect(recorder.requests.some((request) => request.url.includes('currency=GBP'))).toBe(
        true,
      );
    });
    recorder.stop();
  });

  it('honours a currency from the URL', async () => {
    const recorder = recordRequests();
    renderWithProviders(<BalancePage />, { route: '/balance?currency=EUR' });

    await waitFor(() => {
      expect(recorder.requests.some((request) => request.url.includes('currency=EUR'))).toBe(
        true,
      );
    });
    recorder.stop();
  });
});

describe('the breakdown', () => {
  it('renders the ledger-account breakdown region', async () => {
    renderWithProviders(<BalancePage />, { route: '/balance' });

    expect(
      await screen.findByRole('region', { name: 'Balance breakdown by ledger account' }),
    ).toBeInTheDocument();
  });

  it('names the section in plain language', async () => {
    renderWithProviders(<BalancePage />, { route: '/balance' });

    expect(
      await screen.findByRole('heading', { name: 'Where the money sits' }),
    ).toBeInTheDocument();
  });

  it('lists the buckets the ledger returned', async () => {
    renderWithProviders(<BalancePage />, { route: '/balance' });

    await screen.findByRole('heading', { name: 'Where the money sits' });
    const region = screen.getByRole('region', { name: 'Balance breakdown by ledger account' });

    expect(region.textContent).toMatch(/payable/i);
    expect(region.textContent).toMatch(/receivable/i);
  });
});

describe('the negative-balance alert', () => {
  it('is absent for a healthy balance', async () => {
    renderWithProviders(<BalancePage />, { route: '/balance' });

    await screen.findByRole('heading', { name: 'Where the money sits' });
    expect(screen.queryByText(/negative/i)).not.toBeInTheDocument();
  });

  it('appears when the merchant owes Payzeno money', async () => {
    server.use(
      http.get(url('/balance'), () =>
        HttpResponse.json(
          makeBalance({ available_minor: -42_000, negative_balance_minor: 42_000 }),
        ),
      ),
    );

    renderWithProviders(<BalancePage />, { route: '/balance' });

    await waitFor(() => {
      expect(screen.getByText(/negative/i)).toBeInTheDocument();
    });
  });
});

describe('failure', () => {
  it('renders an error state rather than a zero balance', async () => {
    server.use(errorHandler('get', '/balance', 502, 'processor_unavailable'));

    renderWithProviders(<BalancePage />, { route: '/balance' });

    expect(
      await screen.findByRole('heading', { name: 'We could not load your balance' }),
    ).toBeInTheDocument();
  });
});
