/**
 * `useDisputes`.
 *
 * A dispute has a hard deadline. `_hoursRemaining` and `urgentCount` exist so the console can
 * say "respond in the next 6 hours" rather than printing a timestamp and hoping. The clock
 * arithmetic is pinned with a frozen `now`, because a test that changes behaviour at midnight
 * is worse than no test.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EVIDENCE_URGENT_HOURS, hoursUntil, useDisputes } from '@features/disputes/useDisputes';
import { makeDispute, makePage } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

const NOW = new Date('2026-03-14T09:21:07.412Z');

afterEach(() => {
  vi.useRealTimers();
});

describe('hoursUntil', () => {
  it('returns the hours between now and the deadline', () => {
    expect(hoursUntil('2026-03-14T21:21:07.412Z', NOW)).toBeCloseTo(12, 5);
  });

  it('goes negative once the deadline has passed', () => {
    expect(hoursUntil('2026-03-13T09:21:07.412Z', NOW)).toBeCloseTo(-24, 5);
  });

  it('returns null when there is no deadline', () => {
    expect(hoursUntil(null, NOW)).toBeNull();
  });

  it('returns null for an unparseable deadline rather than NaN', () => {
    expect(hoursUntil('not-a-date', NOW)).toBeNull();
  });
});

describe('the list', () => {
  it('reads /v1/disputes and returns both rows', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useDisputes());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const request = recorder.requests.find((candidate) => candidate.url.includes('/v1/disputes'));
    recorder.stop();

    expect(request?.method).toBe('GET');
  });

  it('passes a status filter through', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useDisputes({ status: 'needs_response' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) => candidate.url.includes('/v1/disputes'));
    recorder.stop();

    expect(request?.url).toContain('status=needs_response');
  });

  it('carries the network reason code through, which is what a chargeback team quotes', async () => {
    const { result } = renderHookWithProviders(() => useDisputes());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });
    expect(result.current.rows[0]?.network_reason_code).toBe('10.4');
  });
});

describe('_hoursRemaining', () => {
  it('is computed from the evidence deadline', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const { result } = renderHookWithProviders(() => useDisputes());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    // The fixture deadline is 2026-03-21T23:59:59Z — a little under eight days out.
    expect(result.current.rows[0]?._hoursRemaining).toBeGreaterThan(24);
  });

  it('is null when the dispute has no deadline', async () => {
    server.use(
      http.get(url('/disputes'), () =>
        HttpResponse.json(
          makePage([makeDispute({ status: 'won', evidence_due_by: null })]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useDisputes());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.rows[0]?._hoursRemaining).toBeNull();
  });
});

describe('urgentCount', () => {
  it('counts only disputes that both need a response and are inside the window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    server.use(
      http.get(url('/disputes'), () =>
        HttpResponse.json(
          makePage([
            makeDispute({
              id: 'dp_urgent',
              status: 'needs_response',
              evidence_due_by: '2026-03-15T09:00:00.000Z',
            }),
            makeDispute({
              id: 'dp_later',
              status: 'needs_response',
              evidence_due_by: '2026-03-25T09:00:00.000Z',
            }),
            makeDispute({
              id: 'dp_submitted',
              status: 'under_review',
              evidence_due_by: '2026-03-15T09:00:00.000Z',
            }),
          ]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useDisputes());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });

    expect(result.current.urgentCount).toBe(1);
  });

  it('uses a 48-hour window', () => {
    expect(EVIDENCE_URGENT_HOURS).toBe(48);
  });

  it('is zero when nothing needs a response', async () => {
    server.use(
      http.get(url('/disputes'), () =>
        HttpResponse.json(makePage([makeDispute({ status: 'won' })])),
      ),
    );

    const { result } = renderHookWithProviders(() => useDisputes());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.urgentCount).toBe(0);
  });
});

describe('pagination and failure', () => {
  it('exposes the pagination handle the table drives', async () => {
    const { result } = renderHookWithProviders(() => useDisputes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pagination.pageNumber).toBe(1);
    expect(result.current.pagination.canGoBack).toBe(false);
  });

  it('surfaces an error and keeps the list empty', async () => {
    server.use(errorHandler('get', '/disputes', 500, 'internal_error'));

    const { result } = renderHookWithProviders(() => useDisputes());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.rows).toEqual([]);
  });
});
