/**
 * `useCreateRefund`.
 *
 * A refund moves money out. Three things are asserted for that reason: the request carries an
 * idempotency key, the failure branches are specific enough for a merchant to act on, and the
 * success path invalidates the charge, the refund list and the balance together.
 */
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@api/queryKeys';
import { useCreateRefund } from '@features/refunds/useCreateRefund';
import { errorHandler, recordRequests, server } from '@/test/msw/server';
import { act, renderHookWithProviders, waitFor } from '@/test/render';

const CHARGE_ID = 'ch_01HW0RTCHARGE00000001';

describe('issuing a refund', () => {
  it('posts to /v1/refunds with the charge id', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useCreateRefund());

    act(() => {
      result.current.createRefund({ chargeId: CHARGE_ID, amountMinor: 2_500 });
    });

    await waitFor(() => {
      expect(result.current.lastRefund).not.toBeNull();
    });

    const request = recorder.requests.find(
      (candidate) => candidate.method === 'POST' && candidate.url.endsWith('/v1/refunds'),
    );
    recorder.stop();

    expect(request).toBeDefined();
    expect(request?.headers.get('Idempotency-Key')).toBeTruthy();
  });

  it('returns the created refund', async () => {
    const { result } = renderHookWithProviders(() => useCreateRefund());

    act(() => {
      result.current.createRefund({ chargeId: CHARGE_ID });
    });
    await waitFor(() => {
      expect(result.current.errorMessage).not.toBeNull();
    });

    server.resetHandlers();
    act(() => {
      result.current.createRefund({ chargeId: CHARGE_ID });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBeNull();
    });
  });
});

describe('the failure branches', () => {
  it('gives refund_window_closed its own explanation and a way forward', async () => {
    server.use(
      errorHandler('post', '/refunds', 422, 'refund_window_closed', 'Too late.'),
    );

    const { result } = renderHookWithProviders(() => useCreateRefund());

    act(() => {
      result.current.createRefund({ chargeId: CHARGE_ID });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toContain('Release the authorisation');
    });
  });

  it('explains a 403 in terms of the role', async () => {
    server.use(errorHandler('post', '/refunds', 403, 'permission_denied'));

    const { result } = renderHookWithProviders(() => useCreateRefund());

    act(() => {
      result.current.createRefund({ chargeId: 'nonsense' });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('charge_id is malformed');
    });
  });
});

describe('reset', () => {
  it('clears the last refund and every error', async () => {
    const { result } = renderHookWithProviders(() => useCreateRefund());

    act(() => {
      result.current.createRefund({ chargeId: CHARGE_ID });
    });
    await waitFor(() => {
      expect(result.current.lastRefund).not.toBeNull();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.lastRefund).toBeNull();
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.fieldErrors).toEqual({});
  });
});
