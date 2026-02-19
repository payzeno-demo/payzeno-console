/**
 * `ReportingPage` — the landing route, and the only page rendered eagerly by the router.
 *
 * The degraded state is what this file mostly exists for. Reporting reads three services; when
 * one of them is slow or down the page must keep the merchant's payments, balance and payouts
 * usable and say plainly that *these numbers* are the affected ones.
 */
import { describe, expect, it } from 'vitest';

import { ReportingPage } from '@features/reporting/ReportingPage';
import { errorHandler, recordRequests, server } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

describe('the page', () => {
  it('greets the merchant by display name', async () => {
    renderWithProviders(<ReportingPage />, { route: '/' });

    expect(
      await screen.findByRole('heading', { name: 'Hello, Northwind' }),
    ).toBeInTheDocument();
  });

  it('names the window it is showing', async () => {
    renderWithProviders(<ReportingPage />, { route: '/' });

    expect(await screen.findByText('Last 7 days')).toBeInTheDocument();
  });

  it('honours a window from the URL', async () => {
    renderWithProviders(<ReportingPage />, { route: '/?window=30d' });

    expect(await screen.findByText('Last 30 days')).toBeInTheDocument();
  });

  it('sets the document title', async () => {
    renderWithProviders(<ReportingPage />, { route: '/' });

    await waitFor(() => {
      expect(document.title).toContain('Dashboard');
    });
  });

  it('renders a labelled window filter', async () => {
    renderWithProviders(<ReportingPage />, { route: '/' });

    expect(await screen.findByRole('search', { name: 'Reporting window' })).toBeInTheDocument();
  });
});

describe('the reads it makes', () => {
  it('asks for the summary, the volume series and the balance history', async () => {
    const recorder = recordRequests();
    renderWithProviders(<ReportingPage />, { route: '/' });

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('/reporting/summary')),
      ).toBe(true);
    });
    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('/reporting/volume')),
      ).toBe(true);
    });
    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('/reporting/balance-history')),
      ).toBe(true);
    });
    recorder.stop();
  });

  it('sends the window it is displaying', async () => {
    const recorder = recordRequests();
    renderWithProviders(<ReportingPage />, { route: '/?window=24h' });

    await waitFor(() => {
      expect(
        recorder.requests.some(
          (request) =>
            request.url.includes('/reporting/summary') && request.url.includes('window=24h'),
        ),
      ).toBe(true);
    });
    recorder.stop();
  });
});

describe('the balance-history card', () => {
  it('renders with a heading', async () => {
    renderWithProviders(<ReportingPage />, { route: '/' });

    expect(
      await screen.findByRole('heading', { name: 'Balance over time' }),
    ).toBeInTheDocument();
  });

  it('says how much is available now', async () => {
    renderWithProviders(<ReportingPage />, { route: '/' });

    await screen.findByRole('heading', { name: 'Balance over time' });
    await waitFor(() => {
      expect(screen.getByText(/Available now:/)).toBeInTheDocument();
    });
  });

  it('explains a slow ledger instead of rendering an empty chart', async () => {
    server.use(errorHandler('get', '/reporting/balance-history', 502, 'processor_unavailable'));

    renderWithProviders(<ReportingPage />, { route: '/' });

    expect(
      await screen.findByText(/The ledger did not answer in time/),
    ).toBeInTheDocument();
  });
});

describe('degradation', () => {
  it('shows the degraded banner on a 502 from the summary', async () => {
    server.use(errorHandler('get', '/reporting/summary', 502, 'processor_unavailable'));

    renderWithProviders(<ReportingPage />, { route: '/' });

    expect(await screen.findByText('Reporting is degraded')).toBeInTheDocument();
  });

  it('reassures that payments, balance and payouts are unaffected', async () => {
    server.use(errorHandler('get', '/reporting/summary', 502, 'processor_unavailable'));

    renderWithProviders(<ReportingPage />, { route: '/' });

    expect(
      await screen.findByText(/payments, balance and payouts are unaffected/),
    ).toBeInTheDocument();
  });

  it('shows the error state, not the degraded banner, for a real 500', async () => {
    server.use(errorHandler('get', '/reporting/summary', 500, 'internal_error'));

    renderWithProviders(<ReportingPage />, { route: '/' });

    expect(
      await screen.findByRole('heading', { name: 'We could not load your summary' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Reporting is degraded')).not.toBeInTheDocument();
  });

  it('shows neither on a healthy load', async () => {
    renderWithProviders(<ReportingPage />, { route: '/' });

    await screen.findByRole('heading', { name: 'Balance over time' });
    expect(screen.queryByText('Reporting is degraded')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'We could not load your summary' }),
    ).not.toBeInTheDocument();
  });
});
