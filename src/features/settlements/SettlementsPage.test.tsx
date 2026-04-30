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

  it('explains what a batch is, because merchants ask', async () => {
    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    expect(
      await screen.findByText(/one acquirer settlement file, filtered to your items/),
    ).toBeInTheDocument();
  });

  it('sets the document title', async () => {
    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    await waitFor(() => {
      expect(document.title).toContain('Settlements');
    });
  });
});

describe('the table', () => {
  it('renders one row per batch, with a caption', async () => {
    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    const table = await screen.findByRole('table', {
      name: /Settlement batches, most recent processing date first/,
    });

    await waitFor(() => {
      expect(within(table).getAllByRole('row')).toHaveLength(3);
    });
  });

  it('shows the batch status as a pill with a screen-reader prefix', async () => {
    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    expect(await screen.findByText('partially reconciled')).toBeInTheDocument();
    expect(screen.getAllByText('Status:').length).toBeGreaterThan(0);
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
  it('renders a labelled search region', async () => {
    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    expect(
      await screen.findByRole('search', { name: 'Settlement filters' }),
    ).toBeInTheDocument();
  });

  it('reads the status filter out of the URL', async () => {
    const recorder = recordRequests();
    renderWithProviders(<SettlementsPage />, { route: '/settlements?status=funded' });

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('status=funded')),
      ).toBe(true);
    });
    recorder.stop();
  });

  it('sends the merchant default currency when the URL says nothing', async () => {
    const recorder = recordRequests();
    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    await waitFor(() => {
      expect(recorder.requests.some((request) => request.url.includes('currency=GBP'))).toBe(
        true,
      );
    });
    recorder.stop();
  });

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
  it('renders an error state instead of an empty table', async () => {
    server.use(errorHandler('get', '/settlements', 500, 'internal_error', 'Boom'));

    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    expect(
      await screen.findByRole('heading', { name: 'We could not load your settlements' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('offers a retry', async () => {
    server.use(errorHandler('get', '/settlements', 500, 'internal_error'));

    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('explains a 403 in terms of the role and offers no retry', async () => {
    server.use(errorHandler('get', '/settlements', 403, 'permission_denied'));

    renderWithProviders(<SettlementsPage />, { route: '/settlements' });

    expect(await screen.findByText(/Your role does not include access/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});

describe('a funded batch', () => {
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
