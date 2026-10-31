/**
 * `CustomersPage` — RFC platform-v2 §5. Search is an email prefix in the URL.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { CustomersPage } from '@features/customers/CustomersPage';
import { recordRequests } from '@/test/msw/server';
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

describe('the list', () => {
  it('renders a row per customer, linked to its detail page', async () => {
    renderWithProviders(<CustomersPage />, { route: '/customers' });

    const table = await screen.findByRole('table', { name: 'Customers, newest first' });
    await waitFor(() => expect(table.querySelectorAll('tbody tr')).toHaveLength(2));
    expect(within(table).getByRole('link', { name: 'Amara Osei' })).toHaveAttribute(
      'href',
      '/customers/cus_01HW0RTCUSTOMER00000001',
    );
  });

  it('searches by email from the URL', async () => {
    const recorder = recordRequests();
    renderWithProviders(<CustomersPage />, { route: '/customers?email=liam.becker@example.de' });

    const table = await screen.findByRole('table', {
      name: 'Customers with the email liam.becker@example.de',
    });
    await waitFor(() => expect(table.querySelectorAll('tbody tr')).toHaveLength(1));
    expect(
      recorder.requests.some((request) =>
        request.url.includes(`email=${encodeURIComponent('liam.becker@example.de')}`),
      ),
    ).toBe(true);
    recorder.stop();
  });

  it('types into the search box and says when nothing matches', async () => {
    const { user } = renderWithProviders(<CustomersPage />, { route: '/customers' });

    await user.click(await screen.findByLabelText('Email'));
    await user.paste('amara');

    expect(
      await screen.findByRole('table', { name: 'Customers with the email amara' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('No matches')).toBeInTheDocument();
  });
});
