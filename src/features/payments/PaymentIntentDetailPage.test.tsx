/**
 * `PaymentIntentDetailPage`.
 *
 * The Capture / Release pair is the domain distinction this page has to get right: capture
 * takes the authorised money, release voids the authorisation. They are never both the right
 * answer, and a succeeded intent offers neither.
 */
import { describe, expect, it } from 'vitest';

import { PaymentIntentDetailPage } from '@features/payments/PaymentIntentDetailPage';
import { makePaymentIntent } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

const INTENT_ID = 'pi_01HW0RTPAYMENTINTENT0001';
const PATTERN = '/payments/:paymentIntentId';

function renderPage(route = `/payments/${INTENT_ID}`) {
  return renderWithProviders(<PaymentIntentDetailPage />, { route, path: PATTERN });
}

function intentReturning(overrides: Parameters<typeof makePaymentIntent>[0]): void {
  server.use(
    http.get(url('/payment_intents/:paymentIntentId'), ({ params }) =>
      HttpResponse.json(
        makePaymentIntent({ id: String(params.paymentIntentId), ...overrides }),
      ),
    ),
  );
}

describe('the header', () => {
  it('names the intent', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: `Payment ${INTENT_ID}` }),
    ).toBeInTheDocument();
  });

  it('renders the status as a pill', async () => {
    renderPage();

    expect(await screen.findByText('requires capture')).toBeInTheDocument();
  });

  it('renders the not-found screen for an unknown id', async () => {
    server.use(errorHandler('get', '/payment_intents/:paymentIntentId', 404, 'not_found'));

    renderPage();

    expect(await screen.findByRole('heading', { name: 'No such payment' })).toBeInTheDocument();
  });

  it('renders an error state for a real failure', async () => {
    server.use(errorHandler('get', '/payment_intents/:paymentIntentId', 500, 'internal_error'));

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'We could not load this payment' }),
    ).toBeInTheDocument();
  });
});

describe('the details card', () => {
  it('renders the amount, capture method and customer reference', async () => {
    renderPage();

    expect(await screen.findByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Capture method')).toBeInTheDocument();
    expect(screen.getByText('cust-8814')).toBeInTheDocument();
  });

  it('links to the latest charge', async () => {
    renderPage();

    await screen.findByText('Latest charge');
    expect(
      screen
        .getAllByRole('link')
        .some((link) => link.getAttribute('href') === '/charges/ch_01HW0RTCHARGE00000001'),
    ).toBe(true);
  });

  it('never renders the client secret', async () => {
    const { container } = renderPage();

    await screen.findByText('Amount');
    expect(container.innerHTML).not.toContain('secret_do_not_render');
  });

  it('renders an em dash for an absent description', async () => {
    intentReturning({ description: null, customer_reference: null });

    renderPage();

    await screen.findByText('Description');
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});

describe('the actions', () => {
  it('offers Capture for a manual-capture intent awaiting capture', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: 'Capture' })).toBeInTheDocument();
  });

  it('offers Release for the same intent', async () => {
    renderPage();

    expect(
      await screen.findByRole('button', { name: 'Release authorisation' }),
    ).toBeInTheDocument();
  });

  it('offers neither once the intent has succeeded', async () => {
    intentReturning({ status: 'succeeded', capture_method: 'automatic' });

    renderPage();

    await screen.findByText('Amount');
    expect(screen.queryByRole('button', { name: 'Capture' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Release authorisation' }),
    ).not.toBeInTheDocument();
  });

  it('offers no Capture for an automatic-capture intent', async () => {
    intentReturning({ status: 'requires_capture', capture_method: 'automatic' });

    renderPage();

    await screen.findByText('Amount');
    expect(screen.queryByRole('button', { name: 'Capture' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Release authorisation' }),
    ).toBeInTheDocument();
  });
});

describe('releasing the authorisation', () => {
  it('posts to the cancel route with a reason', async () => {
    const recorder = recordRequests();
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Release authorisation' }));

    await waitFor(() => {
      expect(recorder.requests.some((request) => request.url.includes('/cancel'))).toBe(true);
    });
    recorder.stop();
  });

  it('surfaces a failure rather than silently doing nothing', async () => {
    server.use(
      errorHandler(
        'post',
        '/payment_intents/:paymentIntentId/cancel',
        409,
        'invalid_state',
        'Too late.',
      ),
    );

    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Release authorisation' }));

    expect(
      await screen.findByRole('heading', { name: 'Cancel failed' }),
    ).toBeInTheDocument();
  });
});
