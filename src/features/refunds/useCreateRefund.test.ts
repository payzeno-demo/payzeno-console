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
      result.current.createRefund({ chargeId: CHARGE_ID, amountMinor: 2_500 });
    });

    await waitFor(() => {
      expect(result.current.lastRefund).not.toBeNull();
    });

    expect(result.current.lastRefund?.charge_id).toBe(CHARGE_ID);
    expect(result.current.lastRefund?.amount_minor).toBe(2_500);
  });

  it('refunds the full captured amount when no amount is given', async () => {
    const { result } = renderHookWithProviders(() => useCreateRefund());

    act(() => {
      result.current.createRefund({ chargeId: CHARGE_ID });
    });

    await waitFor(() => {
      expect(result.current.lastRefund).not.toBeNull();
    });
    expect(result.current.lastRefund?.amount_minor).toBe(12_500);
  });

  it('invalidates the refund list, the charge and the balance', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useCreateRefund());

    queryClient.setQueryData(queryKeys.refunds.list({ limit: 25 }), {
      data: [],
      next_cursor: null,
      has_more: false,
    });
    queryClient.setQueryData(queryKeys.charges.detail(CHARGE_ID), { id: CHARGE_ID });
    queryClient.setQueryData(queryKeys.balance.current('GBP'), { available_minor: 1 });

    act(() => {
      result.current.createRefund({ chargeId: CHARGE_ID });
    });

    await waitFor(() => {
      expect(queryClient.getQueryState(queryKeys.charges.detail(CHARGE_ID))?.isInvalidated).toBe(
        true,
      );
    });

    expect(queryClient.getQueryState(queryKeys.balance.current('GBP'))?.isInvalidated).toBe(true);
  });

  it('clears any previous error when a new attempt starts', async () => {
    server.use(errorHandler('post', '/refunds', 500, 'internal_error', 'Boom'));
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
      expect(result.current.errorMessage).toBe(
        'This charge is past the refund window. Ask support to raise a credit instead.',
      );
    });
  });

  it('maps other 422 field errors onto the form', async () => {
    server.use(
      errorHandler('post', '/refunds', 422, 'validation_failed', 'Check the amount.', {
        field_errors: [{ path: 'amount_minor', message: 'Above the refundable amount.' }],
      }),
    );

    const { result } = renderHookWithProviders(() => useCreateRefund());

    act(() => {
      result.current.createRefund({ chargeId: CHARGE_ID, amountMinor: 999_999 });
    });

    await waitFor(() => {
      expect(result.current.fieldErrors).toEqual({
        amount_minor: 'Above the refundable amount.',
      });
    });
    expect(result.current.errorMessage).toBe('Check the amount.');
  });

  it('explains a 409 as "not captured yet" and points at the right action', async () => {
    server.use(errorHandler('post', '/refunds', 409, 'invalid_state', 'Not captured.'));

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
      result.current.createRefund({ chargeId: CHARGE_ID });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe(
        'Issuing a refund needs an owner or admin role.',
      );
    });
  });

  it('falls back to the server message for anything else', async () => {
    server.use(
      errorHandler('post', '/refunds', 400, 'invalid_request', 'charge_id is malformed'),
    );

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
