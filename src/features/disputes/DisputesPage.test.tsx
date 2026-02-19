/**
 * `DisputesPage`.
 *
 * A dispute has a hard deadline, so the urgency banner is the point of the page rather than a
 * decoration: a merchant who misses the evidence window loses by default.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DisputesPage } from '@features/disputes/DisputesPage';
import { makeDispute, makePage } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

const NOW = new Date('2026-03-14T09:21:07.412Z');

afterEach(() => {
  vi.useRealTimers();
});

describe('the page', () => {
  it('renders its heading and description', async () => {
    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    expect(await screen.findByRole('heading', { name: 'Disputes' })).toBeInTheDocument();
    expect(
      screen.getByText('Chargebacks raised against your charges, and the clock on each.'),
    ).toBeInTheDocument();
  });

  it('sets the document title', async () => {
    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    await waitFor(() => {
      expect(document.title).toContain('Disputes');
    });
  });

  it('renders a labelled filter region', async () => {
    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    expect(await screen.findByRole('search', { name: 'Dispute filters' })).toBeInTheDocument();
  });

  it('reads the status filter out of the URL', async () => {
    const recorder = recordRequests();
    renderWithProviders(<DisputesPage />, { route: '/disputes?status=needs_response' });

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('status=needs_response')),
      ).toBe(true);
    });
    recorder.stop();
  });
});

describe('the urgency banner', () => {
  it('stays hidden when nothing is close to its deadline', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.queryByText('Evidence due soon')).not.toBeInTheDocument();
  });

  it('appears when a dispute needs a response inside the window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    server.use(
      http.get(url('/disputes'), () =>
        HttpResponse.json(
          makePage([
            makeDispute({
              status: 'needs_response',
              evidence_due_by: '2026-03-15T09:00:00.000Z',
            }),
          ]),
        ),
      ),
    );

    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    expect(await screen.findByText('Evidence due soon')).toBeInTheDocument();
  });

  it('is polite rather than assertive — it is important, not an emergency mid-sentence', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    server.use(
      http.get(url('/disputes'), () =>
        HttpResponse.json(
          makePage([
            makeDispute({
              status: 'needs_response',
              evidence_due_by: '2026-03-15T09:00:00.000Z',
            }),
          ]),
        ),
      ),
    );

    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    const banner = await screen.findByRole('status');
    expect(banner).toHaveTextContent(/Evidence due soon/);
  });
});

describe('the table', () => {
  it('renders a row per dispute', async () => {
    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    const table = await screen.findByRole('table');
    await waitFor(() => {
      expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
    });
  });

  it('shows the dispute status', async () => {
    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    await screen.findByRole('table');
    expect(screen.getByRole('table').textContent).toMatch(/needs response/i);
  });

  it('shows the reason the issuer gave', async () => {
    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    await screen.findByRole('table');
    expect(screen.getByRole('table').textContent).toMatch(/fraud/i);
  });

  it('renders an empty table when there are no disputes, which is the good case', async () => {
    server.use(http.get(url('/disputes'), () => HttpResponse.json(makePage([]))));

    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    const table = await screen.findByRole('table');
    expect(table.querySelectorAll('tbody tr')).toHaveLength(1);
  });
});

describe('failure', () => {
  it('renders the error state instead of the table', async () => {
    server.use(errorHandler('get', '/disputes', 500, 'internal_error'));

    renderWithProviders(<DisputesPage />, { route: '/disputes' });

    expect(
      await screen.findByRole('heading', { name: 'We could not load your disputes' }),
    ).toBeInTheDocument();
  });
});
