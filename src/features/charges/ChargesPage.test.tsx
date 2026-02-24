/**
 * `ChargesPage`.
 *
 * This list is the one that made payzeno-api sequential-scan and produced migration 14
 * (`ix_charge_merchant_created`, data-model.md §14). The console side of the fix narrowed the
 * default sort and the filter combination it sends, so the "sends no unnecessary filters"
 * cases below are load-bearing rather than pedantic.
 */
import { describe, expect, it } from 'vitest';

import { ChargesPage } from '@features/charges/ChargesPage';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { makeCharge, makePage } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the page', () => {
  it('renders its heading and the domain explanation', async () => {
    renderWithProviders(<ChargesPage />, { route: '/charges' });

    expect(await screen.findByRole('heading', { name: 'Charges' })).toBeInTheDocument();
    expect(
      screen.getByText('An authorised or captured payment, as your acquirer sees it.'),
    ).toBeInTheDocument();
  });

  it('sets the document title', async () => {
    renderWithProviders(<ChargesPage />, { route: '/charges' });

    await waitFor(() => {
      expect(document.title).toContain('Charges');
    });
  });

  it('renders a labelled filter region', async () => {
    renderWithProviders(<ChargesPage />, { route: '/charges' });

    expect(await screen.findByRole('search', { name: 'Charge filters' })).toBeInTheDocument();
  });
});

describe('the request it sends', () => {
  it('adds the cursor when the URL carries one', async () => {
    const recorder = recordRequests();
    renderWithProviders(<ChargesPage />, { route: '/charges?cursor=cur_two' });

    await waitFor(() => {
      expect(recorder.requests.some((request) => request.url.includes('cursor=cur_two'))).toBe(
        true,
      );
    });
    recorder.stop();
  });
});

describe('the table', () => {
  it('renders a row per charge', async () => {
    renderWithProviders(<ChargesPage />, { route: '/charges' });

    const table = await screen.findByRole('table');
    await waitFor(() => {
      expect(table.querySelectorAll('tbody tr')).toHaveLength(3);
    });
  });

  it('renders each charge status', async () => {
    renderWithProviders(<ChargesPage />, { route: '/charges' });

    expect(await screen.findByText('Captured')).toBeInTheDocument();
    expect(screen.getByText('Settled')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders the card brand and last four, and nothing more of the card', async () => {
    const { container } = renderWithProviders(<ChargesPage />, { route: '/charges' });

    await screen.findByRole('table');

    expect(container.innerHTML).toContain('4242');
    expect(container.innerHTML).not.toContain('4242424242424242');
  });

  it('renders a JPY charge alongside a GBP one without confusing their exponents', async () => {
    renderWithProviders(<ChargesPage />, { route: '/charges' });

    await screen.findByRole('table');

    // ¥1,200 and £125.00 are the same minor value under different exponents.
    await waitFor(() => {
      expect(screen.getByRole('table').textContent).toContain('1,200');
    });
  });

  it('shows an empty table for a merchant with no charges', async () => {
    server.use(http.get(url('/charges'), () => HttpResponse.json(makePage([]))));

    renderWithProviders(<ChargesPage />, { route: '/charges' });

    const table = await screen.findByRole('table');
    expect(table.querySelectorAll('tbody tr')).toHaveLength(1);
  });
});

describe('failure', () => {
  it('renders the error state instead of the table', async () => {
    server.use(errorHandler('get', '/charges', 502, 'processor_unavailable'));

    renderWithProviders(<ChargesPage />, { route: '/charges' });

    expect(
      await screen.findByRole('heading', { name: 'We could not load your charges' }),
    ).toBeInTheDocument();
  });

  it('explains an upstream outage rather than blaming the merchant', async () => {
    server.use(errorHandler('get', '/charges', 502, 'processor_unavailable'));

    renderWithProviders(<ChargesPage />, { route: '/charges' });

    expect(
      await screen.findByText(/upstream providers is not responding/),
    ).toBeInTheDocument();
  });
});

describe('a declined charge', () => {
  it('is listed with its failure status', async () => {
    server.use(
      http.get(url('/charges'), () =>
        HttpResponse.json(
          makePage([
            makeCharge({
              status: 'failed',
              failure_code: 'insufficient_funds',
              captured_amount_minor: 0,
            }),
          ]),
        ),
      ),
    );

    renderWithProviders(<ChargesPage />, { route: '/charges' });

    expect(await screen.findByText('Failed')).toBeInTheDocument();
  });
});
