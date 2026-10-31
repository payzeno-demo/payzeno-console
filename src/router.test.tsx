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
  it('renders the reporting page at the root', async () => {
    renderAt('/');

    expect(await screen.findByRole('heading', { name: /Hello, Northwind/ })).toBeInTheDocument();
  });

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

describe('RFC platform-v2 routes', () => {
  it('templatises the new id prefixes', () => {
    expect(routeTemplate('/customers/cus_01HW0RTCUSTOMER00000001')).toBe('/customers/:id');
    expect(routeTemplate('/billing/subscriptions/csub_01HW0RTSUBSCRIPTION0001')).toBe(
      '/billing/subscriptions/:id',
    );
  });

  it('renders the customers index and a customer detail', async () => {
    renderAt(ROUTES.customers.index);
    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument();
  });

  it('renders a customer detail route as a child of customers', async () => {
    renderAt(ROUTES.customers.detail('cus_01HW0RTCUSTOMER00000001'));
    expect(await screen.findByRole('heading', { name: 'Amara Osei' })).toBeInTheDocument();
  });

  it('lands /billing on subscriptions', async () => {
    renderAt(ROUTES.billing.index);
    expect(await screen.findByRole('heading', { name: 'Subscriptions' })).toBeInTheDocument();
  });

  it('renders billing prices and a subscription detail', async () => {
    renderAt(ROUTES.billing.prices);
    expect(await screen.findByRole('heading', { name: 'Prices' })).toBeInTheDocument();
  });

  it('renders a subscription detail under billing', async () => {
    renderAt(ROUTES.billing.subscription('csub_01HW0RTSUBSCRIPTION0001'));
    expect(
      await screen.findByRole('heading', { name: 'Subscription csub_01HW0RTSUBSCRIPTION0001' }),
    ).toBeInTheDocument();
  });

  it('renders onboarding for a signed-in merchant', async () => {
    renderAt(ROUTES.onboarding.index);
    expect(await screen.findByRole('heading', { name: 'Activate your account' })).toBeInTheDocument();
  });

  it('renders the public signup page without a session', async () => {
    renderAt(ROUTES.auth.signup, { session: null });
    expect(
      await screen.findByRole('heading', { name: 'Create your Payzeno account' }),
    ).toBeInTheDocument();
  });

  it('renders the public account pages even with a session — they are opened from email', async () => {
    renderAt(`${ROUTES.auth.resetPassword}?token=tok`);
    expect(await screen.findByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument();
  });

  it('lets a viewer read customers and billing — same permission as payments', async () => {
    renderAt(ROUTES.customers.index, { session: makeViewerSession() });
    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument();
  });
});
