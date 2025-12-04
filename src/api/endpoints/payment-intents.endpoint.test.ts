/**
 * `PaymentIntentsEndpoint` against MSW.
 *
 * Every case here goes over the real `ApiClient`, so the assertion on the URL is an assertion
 * about the four `HTTP_CALLS` rows api-surface.md §12 gives this resource — not about a
 * string this file made up.
 */
import { describe, expect, it } from 'vitest';

import { ApiClient } from '@api/client';
import { PaymentIntentsEndpoint } from '@api/endpoints/payment-intents.endpoint';
import { ResourceEndpoint } from '@api/endpoints/base';
import { ConflictApiError, NotFoundApiError } from '@api/errors';
import { HEADER_IDEMPOTENCY_KEY } from '@api/http/headers';
import { errorHandler, recordRequests, server } from '@/test/msw/server';

function endpoint(): PaymentIntentsEndpoint {
  return new PaymentIntentsEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly, as interfaces.md §4.2 names it', () => {
    const instance = endpoint();
    expect(instance).toBeInstanceOf(PaymentIntentsEndpoint);
    expect(instance).toBeInstanceOf(ResourceEndpoint);
    expect(Object.getPrototypeOf(PaymentIntentsEndpoint)).toBe(ResourceEndpoint);
  });
});

describe('GET /v1/payment_intents', () => {
  it('lists intents and returns the paginated envelope', async () => {
    const page = await endpoint().list();

    expect(page.data).toHaveLength(2);
    expect(page.data[0]?.object).toBe('payment_intent');
    expect(page.has_more).toBe(false);
  });

  it('puts the list query on the query string', async () => {
    const recorder = recordRequests();
    await endpoint().list({ limit: 10, status: 'requires_capture' });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.method).toBe('GET');
    expect(request?.url).toContain('/v1/payment_intents?');
    expect(request?.url).toContain('limit=10');
    expect(request?.url).toContain('status=requires_capture');
  });
});

describe('GET /v1/payment_intents/:paymentIntentId', () => {
  it('reads one intent by id', async () => {
    const intent = await endpoint().get('pi_01HW0RTPAYMENTINTENT0001');

    expect(intent.id).toBe('pi_01HW0RTPAYMENTINTENT0001');
    expect(intent.status).toBe('requires_capture');
  });

  it('surfaces a 404 as NotFoundApiError so the detail page can render <NotFound/>', async () => {
    server.use(
      errorHandler('get', '/payment_intents/:paymentIntentId', 404, 'not_found', 'No such intent'),
    );

    await expect(endpoint().get('pi_missing')).rejects.toBeInstanceOf(NotFoundApiError);
  });
});

describe('POST /v1/payment_intents/:paymentIntentId/capture', () => {
  it('posts to the capture sub-path and returns the moved intent', async () => {
    const recorder = recordRequests();
    const intent = await endpoint().capture('pi_01HW0RTPAYMENTINTENT0001', {});

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.method).toBe('POST');
    expect(request?.url).toBe(
      'http://localhost/v1/payment_intents/pi_01HW0RTPAYMENTINTENT0001/capture',
    );
    expect(intent.status).toBe('succeeded');
  });

  it('mints an idempotency key when the caller does not supply one', async () => {
    const recorder = recordRequests();
    await endpoint().capture('pi_01HW0RTPAYMENTINTENT0001', { amount_minor: 5_000 });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('uses the caller-supplied key verbatim, so a retry of the same attempt collapses', async () => {
    const recorder = recordRequests();
    await endpoint().capture('pi_01HW0RTPAYMENTINTENT0001', {}, 'attempt-capture-1');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toBe('attempt-capture-1');
  });

  it('surfaces a 409 as ConflictApiError — the auth expired or another tab captured it', async () => {
    server.use(
      errorHandler(
        'post',
        '/payment_intents/:paymentIntentId/capture',
        409,
        'invalid_state',
        'This intent cannot be captured.',
      ),
    );

    const thrown = await endpoint()
      .capture('pi_1', {})
      .catch((err: unknown) => err);

    expect(thrown).toBeInstanceOf(ConflictApiError);
    expect((thrown as ConflictApiError).code).toBe('invalid_state');
    expect((thrown as ConflictApiError).isSettlementLocked()).toBe(false);
  });
});

describe('POST /v1/payment_intents/:paymentIntentId/cancel', () => {
  it('posts to the cancel sub-path and returns a canceled intent', async () => {
    const recorder = recordRequests();
    const intent = await endpoint().cancel('pi_01HW0RTPAYMENTINTENT0001', {
      cancellation_reason: 'requested_by_customer',
    });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toBe(
      'http://localhost/v1/payment_intents/pi_01HW0RTPAYMENTINTENT0001/cancel',
    );
    expect(intent.status).toBe('canceled');
    expect(intent.canceled_at).not.toBeNull();
  });

  it('encodes a hostile id rather than letting it forge a path', async () => {
    const recorder = recordRequests();
    await endpoint()
      .cancel('pi_1/../../admin', {})
      .catch(() => undefined);

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('pi_1%2F..%2F..%2Fadmin');
  });
});
