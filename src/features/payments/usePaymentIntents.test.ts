/**
 * `usePaymentIntents`.
 *
 * The three derived flags encode a piece of the domain that the status alone does not carry:
 * an intent is only capturable when it is *both* `requires_capture` and manual-capture, and
 * cancelling releases an authorisation rather than refunding a payment (domain-model.md §4).
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { usePaymentIntents } from '@features/payments/usePaymentIntents';
import { makePage, makePaymentIntent } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the request', () => {
  it('asks for the default page size when the caller gives none', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => usePaymentIntents());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/payment_intents'),
    );
    recorder.stop();

    expect(request?.url).toContain(`limit=${DEFAULT_PAGE_SIZE}`);
  });

  it('lets the caller narrow by status and customer reference', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() =>
      usePaymentIntents({ status: 'requires_capture', customer_reference: 'cust-8814' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/payment_intents'),
    );
    recorder.stop();

    expect(request?.url).toContain('status=requires_capture');
    expect(request?.url).toContain('customer_reference=cust-8814');
  });

  it('lets a caller override the limit', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => usePaymentIntents({ limit: 5 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/payment_intents'),
    );
    recorder.stop();

    expect(request?.url).toContain('limit=5');
  });
});

describe('_isCapturable', () => {
  it('is true for a manual-capture intent awaiting capture', async () => {
    const { result } = renderHookWithProviders(() => usePaymentIntents());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    expect(result.current.rows[0]?._isCapturable).toBe(true);
  });

  it('is false for an automatic-capture intent, whatever its status', async () => {
    server.use(
      http.get(url('/payment_intents'), () =>
        HttpResponse.json(
          makePage([
            makePaymentIntent({ status: 'requires_capture', capture_method: 'automatic' }),
          ]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => usePaymentIntents());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.rows[0]?._isCapturable).toBe(false);
  });

  it('is false once the intent has succeeded', async () => {
    const { result } = renderHookWithProviders(() => usePaymentIntents());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const succeeded = result.current.rows.find((row) => row.status === 'succeeded');
    expect(succeeded?._isCapturable).toBe(false);
  });
});

describe('_isCancelable', () => {
  it.each(['requires_capture', 'requires_confirmation', 'requires_action'] as const)(
    'is true while the intent is still at %s',
    async (status) => {
      server.use(
        http.get(url('/payment_intents'), () =>
          HttpResponse.json(makePage([makePaymentIntent({ status })])),
        ),
      );

      const { result } = renderHookWithProviders(() => usePaymentIntents());

      await waitFor(() => {
        expect(result.current.rows).toHaveLength(1);
      });
      expect(result.current.rows[0]?._isCancelable).toBe(true);
    },
  );

  it('is false once the money has moved — a succeeded intent takes a refund, not a cancel', async () => {
    const { result } = renderHookWithProviders(() => usePaymentIntents());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const succeeded = result.current.rows.find((row) => row.status === 'succeeded');
    expect(succeeded?._isCancelable).toBe(false);
  });
});

describe('_needsCustomerAction', () => {
  it('is true only at requires_action, which is what the callout renders on', async () => {
    server.use(
      http.get(url('/payment_intents'), () =>
        HttpResponse.json(
          makePage([
            makePaymentIntent({ id: 'pi_a', status: 'requires_action' }),
            makePaymentIntent({ id: 'pi_b', status: 'processing' }),
          ]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => usePaymentIntents());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    expect(result.current.rows[0]?._needsCustomerAction).toBe(true);
    expect(result.current.rows[1]?._needsCustomerAction).toBe(false);
  });
});

describe('failure and pagination', () => {
  it('surfaces an error and keeps rows empty', async () => {
    server.use(errorHandler('get', '/payment_intents', 500, 'internal_error'));

    const { result } = renderHookWithProviders(() => usePaymentIntents());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.rows).toEqual([]);
  });

  it('reports the cursor when the envelope has one', async () => {
    server.use(
      http.get(url('/payment_intents'), () =>
        HttpResponse.json(makePage([makePaymentIntent()], true)),
      ),
    );

    const { result } = renderHookWithProviders(() => usePaymentIntents());

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });
    expect(result.current.nextCursor).toBe('cur_next_page_opaque');
  });
});
