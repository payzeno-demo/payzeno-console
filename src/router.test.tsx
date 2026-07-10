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

  it('names the feature a pathname belongs to', () => {
    expect(featureOf('/settlements/sb_1')).toBe('settlements');
    expect(featureOf('/')).toBe('reporting');
  });

  it('templatises resource ids, so telemetry does not get one route per charge', () => {
    expect(routeTemplate('/charges/ch_01HW0RTCHARGE00000001')).toBe('/charges/:id');
    expect(routeTemplate('/settlements')).toBe('/settlements');
  });

  it('builds detail paths with encoded ids', () => {
    expect(ROUTES.settlements.detail('set/1')).toBe('/settlements/set%2F1');
    expect(ROUTES.developers.apiKey('key_1')).toBe('/developers/api-keys/key_1');
  });
});

describe('the signed-in tree', () => {
  it('renders the balance page', async () => {
    renderAt(ROUTES.balance.index);

    expect(await screen.findByRole('heading', { name: 'Balance' })).toBeInTheDocument();
  });

  it('renders the payments index', async () => {
    renderAt(ROUTES.payments.index);

    expect(await screen.findByRole('heading', { name: 'Payments' })).toBeInTheDocument();
  });

  it('renders a payment detail route as a child of payments', async () => {
    renderAt(ROUTES.payments.detail('pi_01HW0RTPAYMENTINTENT0001'));

    expect(
      await screen.findByRole('heading', {
        name: 'Payment pi_01HW0RTPAYMENTINTENT0001',
      }),
    ).toBeInTheDocument();
  });

  it('renders the charges index', async () => {
    renderAt(ROUTES.charges.index);

    expect(await screen.findByRole('heading', { name: 'Charges' })).toBeInTheDocument();
  });

  it('renders a charge detail route', async () => {
    renderAt(ROUTES.charges.detail('ch_01HW0RTCHARGE00000001'));

    expect(
      await screen.findByRole('heading', { name: 'Charge ch_01HW0RTCHARGE00000001' }),
    ).toBeInTheDocument();
  });

  it('renders the settlements index behind its flag', async () => {
    renderAt(ROUTES.settlements.index);

    expect(await screen.findByRole('heading', { name: 'Settlements' })).toBeInTheDocument();
  });

  it('renders a settlement detail route', async () => {
    renderAt(ROUTES.settlements.detail('sb_01HW0RTBATCH000000001'));

    expect(
      await screen.findByRole('heading', {
        name: 'Settlement sb_01HW0RTBATCH000000001',
      }),
    ).toBeInTheDocument();
  });

  it('redirects the legacy /dashboard bookmark to the landing route', async () => {
    renderAt('/dashboard');

    expect(await screen.findByRole('heading', { name: /Hello, Northwind/ })).toBeInTheDocument();
  });
});

describe('the signed-out branch', () => {
  it('renders the login page for a session-less visitor', async () => {
    renderAt(ROUTES.auth.login, { session: null });

    expect(
      await screen.findByRole('heading', { name: 'Sign in to Payzeno' }),
    ).toBeInTheDocument();
  });

  it('bounces a session-less visitor away from a protected route', async () => {
    renderAt(ROUTES.payouts.index, { session: null });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Payouts' })).not.toBeInTheDocument();
    });
  });

  it('bounces a signed-in visitor away from the login page', async () => {
    renderAt(ROUTES.auth.login);

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Sign in to Payzeno' }),
      ).not.toBeInTheDocument();
    });
  });
});

describe('the role guard', () => {
  it('renders a permission-denied screen instead of the feature', async () => {
    renderAt(ROUTES.payouts.index, { session: makeViewerSession() });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Payouts' })).not.toBeInTheDocument();
    });
  });

  it('lets a permitted role through', async () => {
    renderAt(ROUTES.payouts.index);

    expect(await screen.findByRole('heading', { name: 'Payouts' })).toBeInTheDocument();
  });
});

describe('the catch-all', () => {
  it('renders the not-found screen for an unknown path', async () => {
    renderAt('/nowhere-in-particular');

    expect(
      await screen.findByRole('heading', { name: 'We could not find that' }),
    ).toBeInTheDocument();
  });

  it('points home at the landing route', async () => {
    renderAt('/nowhere-in-particular');

    const link = await screen.findByRole('link', { name: 'Back to the dashboard' });
    expect(link).toHaveAttribute('href', ROUTES.reporting.index);
  });

  it('does not swallow a valid path that merely looks odd', async () => {
    renderAt(ROUTES.charges.detail('ch_with-dashes_and_underscores'));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'We could not find that' }),
      ).not.toBeInTheDocument();
    });
  });
});
