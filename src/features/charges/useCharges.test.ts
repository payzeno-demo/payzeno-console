/**
 * `useCharges`.
 *
 * `_isRefundable` is the domain rule the console is most often asked to explain: an
 * `authorized` charge cannot be refunded, it can only be *voided* by cancelling its payment
 * intent, and a void is not a refund (domain-model.md §4). Getting that wrong shows a Refund
 * button that always 409s.
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { useCharges } from '@features/charges/useCharges';
import { makeCharge, makePage } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the request', () => {
  it('asks for the default page size', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });

    const request = recorder.requests.find((candidate) => candidate.url.includes('/v1/charges'));
    recorder.stop();

    expect(request?.url).toContain(`limit=${DEFAULT_PAGE_SIZE}`);
  });

  it('passes a status filter through', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useCharges({ status: 'captured' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) => candidate.url.includes('/v1/charges'));
    recorder.stop();

    expect(request?.url).toContain('status=captured');
  });
});

describe('_refundableMinor', () => {
  it('is captured minus already refunded', async () => {
    server.use(
      http.get(url('/charges'), () =>
        HttpResponse.json(
          makePage([
            makeCharge({ captured_amount_minor: 12_500, refunded_amount_minor: 2_500 }),
          ]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.rows[0]?._refundableMinor).toBe(10_000);
  });

  it('is zero for a fully refunded charge', async () => {
    server.use(
      http.get(url('/charges'), () =>
        HttpResponse.json(
          makePage([
            makeCharge({ captured_amount_minor: 12_500, refunded_amount_minor: 12_500 }),
          ]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.rows[0]?._refundableMinor).toBe(0);
    expect(result.current.rows[0]?._isRefundable).toBe(false);
  });
});

describe('_isRefundable', () => {
  it('is true for a captured charge with headroom', async () => {
    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });

    const captured = result.current.rows.find((row) => row.status === 'captured');
    expect(captured?._isRefundable).toBe(true);
  });

  it('is true for a settled charge too — settlement does not close the refund window', async () => {
    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });

    const settled = result.current.rows.find((row) => row.status === 'settled');
    expect(settled?._isRefundable).toBe(true);
  });

  it('is false for an authorized charge — that takes a void, not a refund', async () => {
    server.use(
      http.get(url('/charges'), () =>
        HttpResponse.json(
          makePage([
            makeCharge({
              status: 'authorized',
              captured_amount_minor: 0,
              refunded_amount_minor: 0,
            }),
          ]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.rows[0]?._isRefundable).toBe(false);
  });

  it('is false for a failed charge', async () => {
    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });

    const failed = result.current.rows.find((row) => row.status === 'failed');
    expect(failed?._isRefundable).toBe(false);
  });
});

describe('currency handling', () => {
  it('leaves a JPY charge in minor units — the console does no money arithmetic', async () => {
    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });

    const jpy = result.current.rows.find((row) => row.currency === 'JPY');
    expect(jpy?.amount_minor).toBe(1_200);
    expect(jpy?._refundableMinor).toBe(1_200);
  });
});

describe('row shape', () => {
  it('starts every row unselected', async () => {
    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });

    expect(result.current.rows.every((row) => row._selected === false)).toBe(true);
  });

  it('carries the contract fields through unchanged', async () => {
    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });

    expect(result.current.rows[0]?.card?.brand).toBe('visa');
    expect(result.current.rows[0]?.acquirer).toBe('worldflow');
  });
});

describe('failure', () => {
  it('surfaces the error and leaves the list empty', async () => {
    server.use(errorHandler('get', '/charges', 502, 'processor_unavailable'));

    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.rows).toEqual([]);
  });
});
