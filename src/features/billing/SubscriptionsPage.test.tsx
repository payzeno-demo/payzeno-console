/**
 * `SubscriptionsPage` — RFC platform-v2 §6. Status filter lives in the URL.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { SubscriptionsPage } from '@features/billing/SubscriptionsPage';
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
  it('shows every subscription with its product and status', async () => {
    renderWithProviders(<SubscriptionsPage />, { route: '/billing/subscriptions' });

    const table = await screen.findByRole('table', { name: 'Subscriptions, newest first' });
    await waitFor(() => expect(table.querySelectorAll('tbody tr')).toHaveLength(2));
    await waitFor(() => expect(within(table).getAllByText('Coffee Club')).toHaveLength(2));
    expect(within(table).getByText('Past due')).toBeInTheDocument();
  });

  it('warns about failing renewals', async () => {
    renderWithProviders(<SubscriptionsPage />, { route: '/billing/subscriptions' });

    expect(await screen.findByText('Renewals are failing')).toBeInTheDocument();
  });

  it('filters by status from the URL', async () => {
    const recorder = recordRequests();
    renderWithProviders(<SubscriptionsPage />, { route: '/billing/subscriptions?status=past_due' });

    const table = await screen.findByRole('table', { name: 'Subscriptions, newest first' });
    await waitFor(() => expect(table.querySelectorAll('tbody tr')).toHaveLength(1));
    expect(recorder.requests.some((request) => request.url.includes('status=past_due'))).toBe(true);
    recorder.stop();
  });
});
