/**
 * `ChargeDetailPage`.
 *
 * The page a support conversation ends up on. Two arcs meet here: arc PCI (only the card
 * *summary* is ever rendered — brand, last four, funding, country) and arc MIG (the ledger
 * panel, which only exists because balances moved to the ledger in step 2).
 */
import { describe, expect, it } from 'vitest';

import { ChargeDetailPage } from '@features/charges/ChargeDetailPage';
import { makeCharge, makeViewerSession } from '@/test/factories';
import { errorHandler, server, url } from '@/test/msw/server';
import { renderWithProviders, screen } from '@/test/render';

import { HttpResponse, http } from 'msw';

const CHARGE_ID = 'ch_01HW0RTCHARGE00000001';
const PATTERN = '/charges/:chargeId';

function renderPage(route = `/charges/${CHARGE_ID}`) {
  return renderWithProviders(<ChargeDetailPage />, { route, path: PATTERN });
}

function chargeReturning(overrides: Parameters<typeof makeCharge>[0]): void {
  server.use(
    http.get(url('/charges/:chargeId'), ({ params }) =>
      HttpResponse.json(makeCharge({ id: String(params.chargeId), ...overrides })),
    ),
  );
}

describe('the header', () => {
  it('names the charge and its acquirer', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: `Charge ${CHARGE_ID}` }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Captured · worldflow/)).toBeInTheDocument();
  });

  it('renders the not-found screen for an unknown id, mentioning test mode', async () => {
    server.use(errorHandler('get', '/charges/:chargeId', 404, 'not_found'));

    renderPage();

    expect(await screen.findByRole('heading', { name: 'No such charge' })).toBeInTheDocument();
    expect(screen.getByText(/id may be from test mode/)).toBeInTheDocument();
  });
});

describe('the amounts card', () => {
  it('renders authorised, captured, refunded and refundable', async () => {
    renderPage();

    expect(await screen.findByText('Authorised')).toBeInTheDocument();
    expect(screen.getByText('Captured')).toBeInTheDocument();
    expect(screen.getByText('Refunded')).toBeInTheDocument();
    expect(screen.getByText('Refundable')).toBeInTheDocument();
  });
});

describe('the card summary (arc PCI)', () => {
  it('renders only the last four digits', async () => {
    const { container } = renderPage();

    await screen.findByText('Card');
    expect(container.innerHTML).toContain('4242');
    expect(container.innerHTML).not.toContain('4242 4242 4242 4242');
  });

  it('says whether liability shifted, which decides who eats a chargeback', async () => {
    renderPage();

    expect(await screen.findByText('Liability')).toBeInTheDocument();
    expect(screen.getByText('Yours')).toBeInTheDocument();
  });

  it('says "Not authenticated" rather than leaving 3-D Secure blank', async () => {
    renderPage();

    expect(await screen.findByText('Not authenticated')).toBeInTheDocument();
  });
});

describe('alerts', () => {
  it('explains a decline with the issuer message', async () => {
    chargeReturning({
      status: 'failed',
      failure_code: 'insufficient_funds',
      failure_message: 'The issuer declined this card.',
      captured_amount_minor: 0,
    });

    renderPage();

    expect(await screen.findByText(/Declined — Insufficient funds/)).toBeInTheDocument();
    expect(screen.getByText('The issuer declined this card.')).toBeInTheDocument();
  });

  it('explains that a captured charge is pending until its batch reconciles', async () => {
    chargeReturning({ status: 'captured', settlement_batch_id: null });

    renderPage();

    expect(await screen.findByText('Not settled yet')).toBeInTheDocument();
  });

  it('does not show the settlement notice once the charge has a batch', async () => {
    renderPage();

    await screen.findByText('Authorised');
    expect(screen.queryByText('Not settled yet')).not.toBeInTheDocument();
  });
});

describe('the refund action', () => {
  it('is enabled for a captured charge with headroom', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: 'Refund' })).toBeEnabled();
  });

  it('is disabled once the charge is fully refunded', async () => {
    chargeReturning({ refunded_amount_minor: 12_500 });

    renderPage();

    expect(await screen.findByRole('button', { name: 'Refund' })).toBeDisabled();
  });

  it('is disabled for a read-only session', async () => {
    renderWithProviders(<ChargeDetailPage />, {
      route: `/charges/${CHARGE_ID}`,
      path: PATTERN,
      session: makeViewerSession(),
    });

    expect(await screen.findByRole('button', { name: 'Refund' })).toBeDisabled();
  });
});

describe('cross-links', () => {
  it('links back to the payment intent', async () => {
    renderPage();

    await screen.findByText('Payment');
    expect(
      screen
        .getAllByRole('link')
        .some(
          (link) =>
            link.getAttribute('href') === '/payments/pi_01HW0RTPAYMENTINTENT0001',
        ),
    ).toBe(true);
  });

  it('links to the settlement batch when there is one', async () => {
    renderPage();

    await screen.findByText('Settlement batch');
    expect(
      screen
        .getAllByRole('link')
        .some(
          (link) =>
            link.getAttribute('href') === '/settlements/sb_01HW0RTBATCH000000001',
        ),
    ).toBe(true);
  });

  it('renders an em dash rather than a dead link when the charge is unsettled', async () => {
    chargeReturning({ settlement_batch_id: null });

    renderPage();

    await screen.findByText('Settlement batch');
    expect(
      screen
        .getAllByRole('link')
        .every((link) => !link.getAttribute('href')?.startsWith('/settlements/')),
    ).toBe(true);
  });
});
