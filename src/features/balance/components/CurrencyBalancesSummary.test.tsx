/**
 * The all-currencies summary on the balance page (RFC platform-v2 §7).
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { CurrencyCode } from '@payzeno/contracts';

import { BalancePage } from '@features/balance/BalancePage';
import { makeBalance } from '@/test/factories';
import { server, url } from '@/test/msw/server';
import { configure, renderWithProviders, screen, waitFor, within } from '@/test/render';

// Page tests here wait on several MSW round trips; on a loaded CI box the default 1s async
// window is not enough, and a flake that only appears under load teaches people to re-run.
// Set at module scope: a test's timeout is fixed when `it` registers it.
vi.setConfig({ testTimeout: 30_000 });
beforeAll(() => {
  configure({ asyncUtilTimeout: 5_000 });
});
afterAll(() => {
  configure({ asyncUtilTimeout: 1_000 });
  vi.resetConfig();
});

describe('on the balance page', () => {
  it('lists every currency that holds money, beside the existing selector', async () => {
    server.use(
      http.get(url('/balance'), ({ request }) => {
        const currency = new URL(request.url).searchParams.get('currency') as CurrencyCode | null;
        if (currency) return HttpResponse.json(makeBalance({ currency }));
        const quiet = {
          pending_minor: 0,
          reserved_minor: 0,
          disputed_minor: 0,
          negative_balance_minor: 0,
        };
        return HttpResponse.json({
          data: [
            makeBalance({ currency: 'GBP', available_minor: 4_182_340, ...quiet }),
            makeBalance({ currency: 'EUR', available_minor: 182_440, ...quiet }),
            makeBalance({ currency: 'ILS', available_minor: 0, ...quiet }),
          ],
        });
      }),
    );

    renderWithProviders(<BalancePage />, { route: '/balance' });

    const table = await screen.findByRole('table', { name: /Your balance in every currency/ });
    await waitFor(() => expect(table.querySelectorAll('tbody tr')).toHaveLength(2));
    expect(within(table).getByText(/GBP — British pound/)).toBeInTheDocument();
    expect(within(table).getByText(/EUR — Euro/)).toBeInTheDocument();
    expect(screen.getByRole('search', { name: 'Balance currency' })).toBeInTheDocument();
  });

  it('selects a currency from its row', async () => {
    const { user } = renderWithProviders(<BalancePage />, { route: '/balance' });

    const table = await screen.findByRole('table', { name: /Your balance in every currency/ });
    await waitFor(() => expect(within(table).getByText(/EUR — Euro/)).toBeInTheDocument());
    await user.click(within(table).getByRole('button', { name: /EUR — Euro/ }));

    await waitFor(() => {
      expect(
        within(table)
          .getByText(/EUR — Euro/)
          .closest('tr')?.textContent,
      ).toMatch(/Showing/);
    });
  });
});
