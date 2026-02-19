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

  it('does not show the settlement notice once the charge has a batch', async () => {
    renderPage();

    await screen.findByText('Authorised');
    expect(screen.queryByText('Not settled yet')).not.toBeInTheDocument();
  });
});

describe('the refund action', () => {
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
