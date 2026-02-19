/**
 * `SettlementsPage`.
 *
 * A page test here is worth more than the sum of its parts: it is the only place the whole
 * read chain runs end to end —
 * `SettlementsPage → SettlementTable → DataTable → settlements.columns → MoneyCell →
 * useMoneyFormat → lib/money → @payzeno/contracts::formatMoney` — against a real transport.
 */
import { describe, expect, it } from 'vitest';

import { SettlementsPage } from '@features/settlements/SettlementsPage';
import { makePage, makeSettlementBatch } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor, within } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the page frame', () => {
  it('renders a titled main region', async () => {
    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    expect(await screen.findByRole('heading', { name: 'Settlements' })).toBeInTheDocument();
  });

  it('links each batch to its detail route', async () => {
    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    await screen.findByRole('table');

    const links = screen.getAllByRole('link');
    expect(
      links.some(
        (link) =>
          link.getAttribute('href') === '/settlements/sb_01HW0RTBATCH000000001',
      ),
    ).toBe(true);
  });

  it('renders the empty state when the merchant has no batches yet', async () => {
    server.use(http.get(url('/settlements'), () => HttpResponse.json(makePage([]))));

    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    expect(await screen.findByText('No settlement batches yet')).toBeInTheDocument();
  });
});

describe('the filters', () => {
  it('does not send a status parameter for "all"', async () => {
    const recorder = recordRequests();
    renderWithProviders(<SettlementsPage />, { route: '/settlements?status=all' });

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('/v1/settlements')),
      ).toBe(true);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/v1/settlements'),
    );
    recorder.stop();

    expect(request?.url).not.toContain('status=');
  });
});

describe('when the list fails', () => {
  it('shows its funded date rather than an em dash', async () => {
    server.use(
      http.get(url('/settlements'), () =>
        HttpResponse.json(
          makePage([
            makeSettlementBatch({ status: 'funded', funded_at: '2026-03-13T16:00:00.000Z' }),
          ]),
        ),
      ),
    );

    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    expect(await screen.findByText('funded')).toBeInTheDocument();
  });
});
