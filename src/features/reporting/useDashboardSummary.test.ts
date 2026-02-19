/**
 * `useDashboardSummary` — the landing page's numbers.
 *
 * `isDegraded` is the interesting one. Reporting aggregates over several services; when one is
 * down the honest answer is "some of these numbers are missing", not a crashed dashboard and
 * not a silent zero. A merchant who sees £0.00 gross volume calls support; a merchant who sees
 * a degraded banner does not.
 */
import { describe, expect, it } from 'vitest';

import { useDashboardSummary } from '@features/reporting/useDashboardSummary';
import { makeDashboardSummary } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the read', () => {
  it('sends the window and the currency', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useDashboardSummary('7d', 'GBP'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/reporting/summary'),
    );
    recorder.stop();

    expect(request?.url).toContain('window=7d');
    expect(request?.url).toContain('currency=GBP');
  });

  it('reads a different window without reusing the first answer', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useDashboardSummary('30d', 'EUR'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/reporting/summary'),
    );
    recorder.stop();

    expect(request?.url).toContain('window=30d');
    expect(request?.url).toContain('currency=EUR');
  });
});

describe('the derived figures', () => {
  it('builds a tile per headline number', async () => {
    const { result } = renderHookWithProviders(() => useDashboardSummary('7d', 'GBP'));

    await waitFor(() => {
      expect(result.current.tiles.length).toBeGreaterThan(0);
    });
  });

  it('reports the currency the API answered in, not the one that was asked for', async () => {
    server.use(
      http.get(url('/reporting/summary'), () =>
        HttpResponse.json(makeDashboardSummary({ currency: 'GBP' })),
      ),
    );

    const { result } = renderHookWithProviders(() => useDashboardSummary('7d', 'EUR'));

    await waitFor(() => {
      expect(result.current.currency).toBe('GBP');
    });
  });

  it('computes the success ratio from the counts', async () => {
    server.use(
      http.get(url('/reporting/summary'), () =>
        HttpResponse.json(
          makeDashboardSummary({ succeeded_count: 90, failed_count: 10 }),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useDashboardSummary('7d', 'GBP'));

    await waitFor(() => {
      expect(result.current.successRatio).toBeCloseTo(0.9, 5);
    });
  });

  it('does not divide by zero on a quiet window', async () => {
    server.use(
      http.get(url('/reporting/summary'), () =>
        HttpResponse.json(
          makeDashboardSummary({ succeeded_count: 0, failed_count: 0, refunded_minor: 0 }),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useDashboardSummary('7d', 'GBP'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(Number.isFinite(result.current.successRatio)).toBe(true);
    expect(Number.isFinite(result.current.refundRatio)).toBe(true);
  });

  it('exposes the next payout id and the available balance for the cards', async () => {
    const { result } = renderHookWithProviders(() => useDashboardSummary('7d', 'GBP'));

    await waitFor(() => {
      expect(result.current.availableMinor).toBeGreaterThan(0);
    });
    expect(result.current.nextPayoutId).toMatch(/^po_/);
  });

  it('reports zero available before anything has loaded, not undefined', () => {
    const { result } = renderHookWithProviders(() => useDashboardSummary('7d', 'GBP'));

    expect(result.current.availableMinor).toBe(0);
    expect(result.current.tiles).toEqual([]);
  });
});

describe('degradation', () => {
  it('flags a 502 as degraded rather than as a failure', async () => {
    server.use(errorHandler('get', '/reporting/summary', 502, 'processor_unavailable'));

    const { result } = renderHookWithProviders(() => useDashboardSummary('7d', 'GBP'));

    await waitFor(() => {
      expect(result.current.isDegraded).toBe(true);
    });
  });

  it('does not flag a 500 as degraded — that is a real error', async () => {
    server.use(errorHandler('get', '/reporting/summary', 500, 'internal_error'));

    const { result } = renderHookWithProviders(() => useDashboardSummary('7d', 'GBP'));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.isDegraded).toBe(false);
  });

  it('is not degraded on a healthy read', async () => {
    const { result } = renderHookWithProviders(() => useDashboardSummary('7d', 'GBP'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isDegraded).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
