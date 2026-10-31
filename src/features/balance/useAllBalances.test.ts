/**
 * `useAllBalances` — RFC platform-v2 §7: `GET /v1/balance` with no `currency` lists every
 * currency balance in one read.
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { useAllBalances } from '@features/balance/useAllBalances';
import { makeBalance } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { configure, renderHookWithProviders, waitFor } from '@/test/render';

// See OnboardingPage.test.tsx: MSW round trips on a loaded CI box outlast the 1s default.
// Set at module scope: a test's timeout is fixed when `it` registers it.
vi.setConfig({ testTimeout: 30_000 });
beforeAll(() => {
  configure({ asyncUtilTimeout: 5_000 });
});
afterAll(() => {
  configure({ asyncUtilTimeout: 1_000 });
  vi.resetConfig();
});

describe('useAllBalances', () => {
  it('reads the list once, with no currency parameter', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useAllBalances());

    await waitFor(() => expect(result.current.rows).toHaveLength(3));
    const reads = recorder.requests.filter((request) => request.url.includes('/v1/balance'));
    expect(reads).toHaveLength(1);
    expect(reads[0]?.url).not.toContain('currency=');
    recorder.stop();
  });

  it('orders currencies the contracts way and marks the ones holding money', async () => {
    server.use(
      http.get(url('/balance'), () =>
        HttpResponse.json({
          data: [
            makeBalance({
              currency: 'JPY',
              available_minor: 0,
              pending_minor: 0,
              disputed_minor: 0,
            }),
            makeBalance({ currency: 'EUR' }),
            makeBalance({ currency: 'USD' }),
          ],
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useAllBalances());

    await waitFor(() => expect(result.current.rows).toHaveLength(3));
    expect(result.current.rows.map((row) => row.currency)).toEqual(['USD', 'EUR', 'JPY']);
    expect(result.current.activeRows.map((row) => row.currency)).toEqual(['USD', 'EUR']);
  });

  it('surfaces a failure without inventing rows', async () => {
    server.use(errorHandler('get', '/balance', 500, 'internal_error'));

    const { result } = renderHookWithProviders(() => useAllBalances());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.rows).toEqual([]);
  });
});
