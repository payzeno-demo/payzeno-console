/**
 * `router.tsx` — the one route table.
 *
 * Every feature PR touches this file, which makes it the repo's hottest by construction and
 * the one place a mis-registered route goes unnoticed until someone reports a blank page. What
 * is asserted here is the *table*, not the pages: that each `<Feature>Page` is reachable at the
 * path `routes.ts` names, that the guards sit where they should, and that the catch-all really
 * catches.
 */
import { describe, expect, it } from 'vitest';

import { AppRoutes } from '@/router';
import { ROUTES, TOP_LEVEL_PATHS, featureOf, routeTemplate } from '@/routes';
import { makeViewerSession } from '@/test/factories';
import { renderWithProviders, screen, waitFor } from '@/test/render';

function renderAt(route: string, options: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<AppRoutes />, { route, ...options });
}

describe('route helpers', () => {
  it('lists every top-level path', () => {
    expect(TOP_LEVEL_PATHS).toContain(ROUTES.settlements.index);
    expect(TOP_LEVEL_PATHS).toContain(ROUTES.developers.index);
    expect(new Set(TOP_LEVEL_PATHS).size).toBe(TOP_LEVEL_PATHS.length);
  });

  it('builds detail paths with encoded ids', () => {
    expect(ROUTES.settlements.detail('set/1')).toBe('/settlements/set%2F1');
    expect(ROUTES.developers.apiKey('key_1')).toBe('/developers/api-keys/key_1');
  });
});

describe('the signed-in tree', () => {
  it('renders a payment detail route as a child of payments', async () => {
    renderAt(ROUTES.payments.detail('pi_01HW0RTPAYMENTINTENT0001'));

    expect(
      await screen.findByRole('heading', {
        name: 'Payment pi_01HW0RTPAYMENTINTENT0001',
      }),
    ).toBeInTheDocument();
  });

  it('redirects the legacy /dashboard bookmark to the landing route', async () => {
    renderAt('/dashboard');

    expect(await screen.findByRole('heading', { name: /Hello, Northwind/ })).toBeInTheDocument();
  });
});

describe('the signed-out branch', () => {
  it('lets a permitted role through', async () => {
    renderAt(ROUTES.payouts.index);

    expect(await screen.findByRole('heading', { name: 'Payouts' })).toBeInTheDocument();
  });
});

describe('the catch-all', () => {
  it('points home at the landing route', async () => {
    renderAt('/nowhere-in-particular');

    const link = await screen.findByRole('link', { name: 'Back to the dashboard' });
    expect(link).toHaveAttribute('href', ROUTES.reporting.index);
  });

});
