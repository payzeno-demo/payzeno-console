/**
 * `useCapturePaymentIntent`.
 *
 * Capture is the console's most consequential single click: it takes money that has only been
 * authorised. The invalidation set matters as much as the request — after a capture, the
 * intent, the charges list and the balance are all stale, and a merchant who sees an unchanged
 * balance presses the button again.
 */
import { describe, expect, it } from 'vitest';

import { HttpResponse, http } from 'msw';

import { queryKeys } from '@api/queryKeys';
import { useCapturePaymentIntent } from '@features/payments/useCapturePaymentIntent';
import { makePaymentIntent } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { act, renderHookWithProviders, waitFor } from '@/test/render';

const INTENT_ID = 'pi_01HW0RTPAYMENTINTENT0001';

describe('capturing in full', () => {
  it('posts to the capture route with an empty body', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useCapturePaymentIntent());

    act(() => {
      result.current.capture({ paymentIntentId: INTENT_ID });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const request = recorder.requests.find((candidate) => candidate.url.includes('/capture'));
    recorder.stop();

    expect(request?.method).toBe('POST');
    expect(request?.url).toBe(`http://localhost/v1/payment_intents/${INTENT_ID}/capture`);
  });

  it('leaves no error message behind', async () => {
    const { result } = renderHookWithProviders(() => useCapturePaymentIntent());

    act(() => {
      result.current.capture({ paymentIntentId: INTENT_ID });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    expect(result.current.errorMessage).toBeNull();
  });
});

describe('capturing partially', () => {
  function captureBody(): { seen: Record<string, unknown> | null } {
    const box: { seen: Record<string, unknown> | null } = { seen: null };
    server.use(
      http.post(url('/payment_intents/:paymentIntentId/capture'), async ({ request, params }) => {
        box.seen = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          makePaymentIntent({ id: String(params.paymentIntentId), status: 'succeeded' }),
        );
      }),
    );
    return box;
  }

  it('sends the amount when the dialog supplied one', async () => {
    const box = captureBody();
    const { result } = renderHookWithProviders(() => useCapturePaymentIntent());

    act(() => {
      result.current.capture({ paymentIntentId: INTENT_ID, amountMinor: 5_000 });
    });

    await waitFor(() => {
      expect(box.seen).not.toBeNull();
    });
    expect(box.seen).toEqual({ amount_minor: 5_000 });
  });

  it('sends an empty object when no amount was given, meaning "capture it all"', async () => {
    const box = captureBody();
    const { result } = renderHookWithProviders(() => useCapturePaymentIntent());

    act(() => {
      result.current.capture({ paymentIntentId: INTENT_ID });
    });

    await waitFor(() => {
      expect(box.seen).not.toBeNull();
    });
    expect(box.seen).toEqual({});
  });
});

describe('cache invalidation', () => {
  it('invalidates the intent, the intent list, the charges and the balance', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useCapturePaymentIntent());

    queryClient.setQueryData(queryKeys.paymentIntents.detail(INTENT_ID), { id: INTENT_ID });
    queryClient.setQueryData(queryKeys.charges.list({ limit: 25 }), {
      data: [],
      next_cursor: null,
      has_more: false,
    });
    queryClient.setQueryData(queryKeys.balance.current('GBP'), { available_minor: 1 });

    act(() => {
      result.current.capture({ paymentIntentId: INTENT_ID });
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(queryKeys.paymentIntents.detail(INTENT_ID))?.isInvalidated,
      ).toBe(true);
    });

    expect(queryClient.getQueryState(queryKeys.charges.list({ limit: 25 }))?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(queryKeys.balance.current('GBP'))?.isInvalidated).toBe(true);
  });
});

describe('failure branches', () => {
  it('explains a 409 as "no longer capturable" rather than echoing the code', async () => {
    server.use(
      errorHandler(
        'post',
        '/payment_intents/:paymentIntentId/capture',
        409,
        'invalid_state',
        'Wrong state.',
      ),
    );

    const { result } = renderHookWithProviders(() => useCapturePaymentIntent());

    act(() => {
      result.current.capture({ paymentIntentId: INTENT_ID });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe(
        'This payment can no longer be captured. Refresh to see its current state.',
      );
    });
  });

  it('shows the server message on a 400 — the API knows why better than we do', async () => {
    server.use(
      errorHandler(
        'post',
        '/payment_intents/:paymentIntentId/capture',
        400,
        'invalid_request',
        'amount_minor exceeds the authorised amount.',
      ),
    );

    const { result } = renderHookWithProviders(() => useCapturePaymentIntent());

    act(() => {
      result.current.capture({ paymentIntentId: INTENT_ID, amountMinor: 99_999 });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('amount_minor exceeds the authorised amount.');
    });
  });

  it('shows the server message for any other ConsoleApiError', async () => {
    server.use(
      errorHandler(
        'post',
        '/payment_intents/:paymentIntentId/capture',
        403,
        'permission_denied',
        'You cannot capture payments.',
      ),
    );

    const { result } = renderHookWithProviders(() => useCapturePaymentIntent());

    act(() => {
      result.current.capture({ paymentIntentId: INTENT_ID });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('You cannot capture payments.');
    });
  });

  it('does not retry a mutation — one click is one capture', async () => {
    let calls = 0;
    server.use(
      errorHandler('post', '/payment_intents/:paymentIntentId/capture', 500, 'internal_error'),
    );
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('/capture')) calls += 1;
    });

    const { result } = renderHookWithProviders(() => useCapturePaymentIntent());

    act(() => {
      result.current.capture({ paymentIntentId: INTENT_ID });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).not.toBeNull();
    });

    server.events.removeAllListeners('request:start');
    expect(calls).toBe(1);
  });
});
