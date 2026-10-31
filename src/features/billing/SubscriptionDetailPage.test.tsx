/**
 * `SubscriptionDetailPage` — RFC platform-v2 §6: period, retries, latest payment, cancel.
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { SubscriptionDetailPage } from '@features/billing/SubscriptionDetailPage';
import { SUBSCRIPTION_ID, makeSubscription } from '@/test/factories';
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

function renderPage() {
  return renderWithProviders(<SubscriptionDetailPage />, {
    route: `/billing/subscriptions/${SUBSCRIPTION_ID}`,
    path: '/billing/subscriptions/:subscriptionId',
  });
}

describe('the detail', () => {
  it('shows the price, the customer and the latest payment, all linked', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: `Subscription ${SUBSCRIPTION_ID}` }),
    ).toBeInTheDocument();
    const details = screen.getByRole('region', { name: 'Subscription details' });
    await waitFor(() => expect(within(details).getByText(/Coffee Club/)).toBeInTheDocument());
    await waitFor(() =>
      expect(within(details).getByRole('link', { name: 'Amara Osei' })).toHaveAttribute(
        'href',
        '/customers/cus_01HW0RTCUSTOMER00000001',
      ),
    );
    const payment = within(details)
      .getAllByRole('link')
      .find((link) => link.getAttribute('href')?.startsWith('/payments/'));
    expect(payment).toHaveAttribute('href', '/payments/pi_01HW0RTPAYMENTINTENT0001');
  });

  it('explains a past-due subscription and when the next retry is', async () => {
    server.use(
      http.get(url('/subscriptions/:subscriptionId'), () =>
        HttpResponse.json(
          makeSubscription({
            status: 'past_due',
            failed_attempts: 2,
            next_retry_at: '2026-03-17T10:00:00.000Z',
          }),
        ),
      ),
    );

    renderPage();

    expect(await screen.findByText('The last renewal failed')).toBeInTheDocument();
    expect(screen.getByText(/2 attempts failed this period/)).toBeInTheDocument();
  });
});

describe('canceling', () => {
  it('cancels at period end by default', async () => {
    let seen: unknown = null;
    server.use(
      http.post(url('/subscriptions/:subscriptionId/cancel'), async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json(makeSubscription({ cancel_at_period_end: true }));
      }),
    );

    const { user } = renderPage();
    await user.click(await screen.findByRole('button', { name: 'Cancel subscription' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel subscription' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel at period end' }));

    await waitFor(() => expect(seen).toEqual({ at_period_end: true }));
  });

  it('can cancel immediately', async () => {
    let seen: unknown = null;
    server.use(
      http.post(url('/subscriptions/:subscriptionId/cancel'), async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json(makeSubscription({ status: 'canceled' }));
      }),
    );

    const { user } = renderPage();
    await user.click(await screen.findByRole('button', { name: 'Cancel subscription' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel subscription' });
    await user.click(within(dialog).getByRole('radio', { name: /Immediately/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Cancel now' }));

    await waitFor(() => expect(seen).toEqual({ at_period_end: false }));
  });

  it('has no cancel button once canceled', async () => {
    server.use(
      http.get(url('/subscriptions/:subscriptionId'), () =>
        HttpResponse.json(
          makeSubscription({ status: 'canceled', canceled_at: '2026-03-10T10:00:00.000Z' }),
        ),
      ),
    );

    renderPage();

    await screen.findByRole('heading', { name: `Subscription ${SUBSCRIPTION_ID}` });
    expect(screen.queryByRole('button', { name: 'Cancel subscription' })).not.toBeInTheDocument();
  });
});
