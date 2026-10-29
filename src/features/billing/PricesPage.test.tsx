/**
 * `PricesPage` — RFC platform-v2 §6.
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { PricesPage } from '@features/billing/PricesPage';
import { makePrice, makeViewerSession } from '@/test/factories';
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

describe('the list', () => {
  it('shows one-off and recurring prices with their cadence', async () => {
    renderWithProviders(<PricesPage />, { route: '/billing/prices' });

    const table = await screen.findByRole('table', { name: 'Your prices, one-off and recurring' });
    await waitFor(() => expect(table.querySelectorAll('tbody tr')).toHaveLength(2));
    expect(within(table).getByText('Recurring · every month')).toBeInTheDocument();
    expect(within(table).getByText('One-off')).toBeInTheDocument();
  });

  it('links to subscriptions as the other half of billing', async () => {
    renderWithProviders(<PricesPage />, { route: '/billing/prices' });

    const nav = await screen.findByRole('navigation', { name: 'Billing sections' });
    expect(within(nav).getByRole('link', { name: 'Subscriptions' })).toHaveAttribute(
      'href',
      '/billing/subscriptions',
    );
  });
});

describe('creating a price', () => {
  it('posts a recurring monthly price by default', async () => {
    let seen: unknown = null;
    server.use(
      http.post(url('/prices'), async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json(makePrice({ id: 'price_new', product_name: 'Beans' }), {
          status: 201,
        });
      }),
    );

    const { user } = renderWithProviders(<PricesPage />, { route: '/billing/prices' });
    await user.click(await screen.findByRole('button', { name: 'New price' }));
    const dialog = await screen.findByRole('dialog', { name: 'New price' });
    await user.click(within(dialog).getByLabelText(/^Product name/));
    await user.paste('Beans');
    await user.click(within(dialog).getByLabelText(/^Amount/));
    await user.paste('12.50');
    await user.click(within(dialog).getByRole('button', { name: 'Create price' }));

    await waitFor(() => {
      expect(seen).toEqual({
        product_name: 'Beans',
        unit_amount_minor: 1250,
        currency: 'GBP',
        recurring: { interval: 'month', interval_count: 1 },
      });
    });
  });

  it('posts a one-off price without `recurring`', async () => {
    let seen: unknown = null;
    server.use(
      http.post(url('/prices'), async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json(makePrice({ recurring: null }), { status: 201 });
      }),
    );

    const { user } = renderWithProviders(<PricesPage />, { route: '/billing/prices' });
    await user.click(await screen.findByRole('button', { name: 'New price' }));
    const dialog = await screen.findByRole('dialog', { name: 'New price' });
    await user.click(within(dialog).getByLabelText(/^Product name/));
    await user.paste('Gift box');
    await user.click(within(dialog).getByLabelText(/^Amount/));
    await user.paste('45');
    await user.click(within(dialog).getByRole('radio', { name: /One-off/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Create price' }));

    await waitFor(() => {
      expect(seen).toEqual({ product_name: 'Gift box', unit_amount_minor: 4500, currency: 'GBP' });
    });
  });

  it('is disabled for a read-only role', async () => {
    renderWithProviders(<PricesPage />, { route: '/billing/prices', session: makeViewerSession() });

    expect(await screen.findByRole('button', { name: 'New price' })).toBeDisabled();
  });
});
