/**
 * `RefundsEndpoint` — the console's only money-moving POST that a merchant fires by hand
 * more than once a day, which is why the idempotency assertions here are not decoration.
 */
import { describe, expect, it } from 'vitest';

import { ApiClient } from '@api/client';
import { ResourceEndpoint } from '@api/endpoints/base';
import { RefundsEndpoint } from '@api/endpoints/refunds.endpoint';
import { ConflictApiError, ValidationApiError } from '@api/errors';
import { HEADER_IDEMPOTENCY_KEY } from '@api/http/headers';
import { errorHandler, recordRequests, server } from '@/test/msw/server';

function endpoint(): RefundsEndpoint {
  return new RefundsEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly', () => {
    expect(Object.getPrototypeOf(RefundsEndpoint)).toBe(ResourceEndpoint);
  });
});

describe('GET /v1/refunds', () => {
  it('lists refunds', async () => {
    const page = await endpoint().list();

    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.object).toBe('refund');
  });

  it('narrows by charge through listForCharge', async () => {
    const recorder = recordRequests();
    await endpoint().listForCharge('ch_01HW0RTCHARGE00000001');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('/v1/refunds?');
    expect(request?.url).toContain('charge_id=ch_01HW0RTCHARGE00000001');
  });

  it('keeps the caller limit alongside the charge filter', async () => {
    const recorder = recordRequests();
    await endpoint().listForCharge('ch_1', { limit: 5 });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('limit=5');
    expect(request?.url).toContain('charge_id=ch_1');
  });
});

describe('POST /v1/refunds', () => {
  it('posts the create request to the collection path', async () => {
    const recorder = recordRequests();
    const refund = await endpoint().create({
      charge_id: 'ch_01HW0RTCHARGE00000001',
      amount_minor: 2_500,
      reason: 'requested_by_customer',
    });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.method).toBe('POST');
    expect(request?.url).toBe('http://localhost/v1/refunds');
    expect(refund.charge_id).toBe('ch_01HW0RTCHARGE00000001');
    expect(refund.amount_minor).toBe(2_500);
    expect(refund.status).toBe('pending');
  });

  it('defaults the amount to the full captured amount when none is given', async () => {
    const refund = await endpoint().create({ charge_id: 'ch_01HW0RTCHARGE00000001' });

    expect(refund.amount_minor).toBe(12_500);
  });

  it('mints a ULID idempotency key per attempt', async () => {
    const recorder = recordRequests();

    await endpoint().create({ charge_id: 'ch_1' });
    await endpoint().create({ charge_id: 'ch_1' });

    const [first, second] = recorder.requests.slice(-2);
    recorder.stop();

    const firstKey = first?.headers.get(HEADER_IDEMPOTENCY_KEY);
    const secondKey = second?.headers.get(HEADER_IDEMPOTENCY_KEY);

    expect(firstKey).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    // Two deliberate refunds are two refunds. Sharing a key would collapse them into one.
    expect(secondKey).not.toBe(firstKey);
  });

  it('honours a supplied key so a transport retry does not double-refund', async () => {
    const recorder = recordRequests();
    await endpoint().create({ charge_id: 'ch_1' }, 'refund-attempt-7');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toBe('refund-attempt-7');
  });

  it('surfaces a 422 refund_window_closed as ValidationApiError', async () => {
    server.use(
      errorHandler(
        'post',
        '/refunds',
        422,
        'refund_window_closed',
        'This charge is past the refund window.',
      ),
    );

    const thrown = await endpoint()
      .create({ charge_id: 'ch_1' })
      .catch((err: unknown) => err);

    expect(thrown).toBeInstanceOf(ValidationApiError);
    expect((thrown as ValidationApiError).code).toBe('refund_window_closed');
  });

  it('surfaces a 409 for an uncaptured charge — a void is not a refund', async () => {
    server.use(
      errorHandler('post', '/refunds', 409, 'invalid_state', 'The charge is not captured.'),
    );

    await expect(endpoint().create({ charge_id: 'ch_1' })).rejects.toBeInstanceOf(
      ConflictApiError,
    );
  });
});
