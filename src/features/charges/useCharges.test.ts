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
    const recorder = recordRequests();
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
      expect(result.current.rows).toHaveLength(3);
    });

    const { result } = renderHookWithProviders(() => useCharges());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.rows).toEqual([]);
  });
});
