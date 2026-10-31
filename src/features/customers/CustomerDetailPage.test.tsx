/**
 * `CustomerDetailPage` — RFC platform-v2 §5: profile, saved cards (removable), payments and
 * subscriptions for one customer.
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { CustomerDetailPage } from '@features/customers/CustomerDetailPage';
import { CUSTOMER_ID, makePage, makePaymentIntent } from '@/test/factories';
import { recordRequests, server, url } from '@/test/msw/server';
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
  return renderWithProviders(<CustomerDetailPage />, {
    route: `/customers/${CUSTOMER_ID}`,
    path: '/customers/:customerId',
  });
}

describe('the profile', () => {
  it('names the customer and shows their email', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Amara Osei' })).toBeInTheDocument();
    const profile = screen.getByRole('region', { name: 'Customer profile' });
    expect(within(profile).getByText('amara.osei@example.com')).toBeInTheDocument();
  });

  it('renders not-found for an unknown customer', async () => {
    server.use(
      http.get(url('/customers/:customerId'), () =>
        HttpResponse.json(
          { error: { code: 'not_found', message: 'nope', request_id: 'req' } },
          { status: 404 },
        ),
      ),
    );

    renderPage();

    expect(await screen.findByRole('heading', { name: 'No such customer' })).toBeInTheDocument();
  });
});

describe('saved cards', () => {
  it('lists them and marks the default', async () => {
    renderPage();

    const table = await screen.findByRole('table', {
      name: 'Cards this customer saved at checkout',
    });
    await waitFor(() => expect(table.querySelectorAll('tbody tr')).toHaveLength(2));
    expect(within(table).getByText('Default')).toBeInTheDocument();
  });

  it('removes one after confirmation, with a DELETE on the nested route', async () => {
    const recorder = recordRequests();
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Remove mastercard ending 5454' }));
    await user.click(await screen.findByRole('button', { name: 'Remove card' }));

    await waitFor(() => {
      expect(
        recorder.requests.some(
          (request) =>
            request.method === 'DELETE' &&
            request.url.endsWith(
              `/customers/${CUSTOMER_ID}/payment_methods/pm_01HW0RTPAYMENTMETHOD0002`,
            ),
        ),
      ).toBe(true);
    });
    recorder.stop();
  });
});

describe('payments and subscriptions', () => {
  it('shows only this customer’s payments, without sending a filter the api rejects', async () => {
    server.use(
      http.get(url('/payment_intents'), () =>
        HttpResponse.json(
          makePage([
            makePaymentIntent({ id: 'pi_theirs', customer_id: CUSTOMER_ID }),
            // An api that ignored the filter would send a stranger's too.
            makePaymentIntent({ id: 'pi_someone_else', customer_id: 'cus_other' }),
          ]),
        ),
      ),
    );
    const recorder = recordRequests();

    renderPage();

    const table = await screen.findByRole('table', { name: 'Payment intents, newest first' });
    await waitFor(() => expect(table.querySelectorAll('tbody tr')).toHaveLength(1));
    expect(within(table).getByTitle('pi_theirs')).toBeInTheDocument();
    expect(within(table).queryByTitle('pi_someone_else')).not.toBeInTheDocument();
    const paymentReads = recorder.requests.filter((request) =>
      request.url.includes('/v1/payment_intents'),
    );
    expect(paymentReads.length).toBeGreaterThan(0);
    expect(paymentReads.every((request) => !request.url.includes('customer_id'))).toBe(true);
    recorder.stop();
  });

  it('lists their subscriptions with the product name', async () => {
    renderPage();

    const table = await screen.findByRole('table', { name: 'Subscriptions for Amara Osei' });
    await waitFor(() => expect(within(table).getByText('Coffee Club')).toBeInTheDocument());
  });
});
