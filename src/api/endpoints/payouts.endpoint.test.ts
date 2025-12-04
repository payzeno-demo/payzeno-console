/**
 * `PayoutsEndpoint`. `payout.failed` is the one event the console surfaces directly
 * (domain-model.md §9), so the failed-payout read path gets its own case here.
 */
import { describe, expect, it } from 'vitest';

import { ApiClient } from '@api/client';
import { ResourceEndpoint } from '@api/endpoints/base';
import { PayoutsEndpoint } from '@api/endpoints/payouts.endpoint';
import { ConflictApiError, ForbiddenError } from '@api/errors';
import { HEADER_IDEMPOTENCY_KEY } from '@api/http/headers';
import { errorHandler, recordRequests, server } from '@/test/msw/server';

function endpoint(): PayoutsEndpoint {
  return new PayoutsEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly', () => {
    expect(Object.getPrototypeOf(PayoutsEndpoint)).toBe(ResourceEndpoint);
  });
});

describe('GET /v1/payouts', () => {
  it('lists payouts including a failed one with its reversal transaction', async () => {
    const page = await endpoint().list();
    const failed = page.data.find((payout) => payout.status === 'failed');

    expect(failed?.failure_code).toBe('bank_rejected');
    expect(failed?.reversal_transaction_id).toBe('txn_01HW0RTLEDGERTXN000009');
  });

  it('filters by status and currency', async () => {
    const recorder = recordRequests();
    await endpoint().list({ status: 'in_transit', currency: 'GBP' });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('status=in_transit');
    expect(request?.url).toContain('currency=GBP');
  });

  it('listFailed pins status=failed and caps the page at 20', async () => {
    const recorder = recordRequests();
    await endpoint().listFailed('GBP');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('status=failed');
    expect(request?.url).toContain('currency=GBP');
    expect(request?.url).toContain('limit=20');
  });

  it('listFailed omits the currency when none is given rather than sending undefined', async () => {
    const recorder = recordRequests();
    await endpoint().listFailed();

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).not.toContain('currency');
    expect(request?.url).toContain('status=failed');
  });
});

describe('GET /v1/payouts/:payoutId', () => {
  it('reads one payout by id', async () => {
    const payout = await endpoint().get('po_01HW0RTPAYOUT00000001');

    expect(payout.id).toBe('po_01HW0RTPAYOUT00000001');
    expect(payout.available_on).toBe('2026-03-14');
  });
});

describe('POST /v1/payouts', () => {
  it('creates a payout and gets back a scheduled one', async () => {
    const recorder = recordRequests();
    const payout = await endpoint().create({ currency: 'GBP', amount_minor: 250_000 });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.method).toBe('POST');
    expect(request?.url).toBe('http://localhost/v1/payouts');
    expect(payout.status).toBe('scheduled');
    expect(payout.amount_minor).toBe(250_000);
    expect(payout.initiated_at).toBeNull();
  });

  it('sends an idempotency key on the create', async () => {
    const recorder = recordRequests();
    await endpoint().create({ currency: 'GBP' });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toBeTruthy();
  });

  it('surfaces payout_blocked as a ConflictApiError with the code intact', async () => {
    server.use(
      errorHandler(
        'post',
        '/payouts',
        409,
        'payout_blocked',
        'Payouts are blocked while your balance is negative.',
      ),
    );

    const thrown = await endpoint()
      .create({ currency: 'GBP' })
      .catch((err: unknown) => err);

    expect(thrown).toBeInstanceOf(ConflictApiError);
    expect((thrown as ConflictApiError).code).toBe('payout_blocked');
  });

  it('surfaces a 403 for a non-admin session', async () => {
    server.use(errorHandler('post', '/payouts', 403, 'permission_denied'));

    await expect(endpoint().create({ currency: 'GBP' })).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('POST /v1/payouts/:payoutId/cancel', () => {
  it('posts an empty body to the cancel sub-path', async () => {
    const recorder = recordRequests();
    const payout = await endpoint().cancel('po_01HW0RTPAYOUT00000001');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toBe('http://localhost/v1/payouts/po_01HW0RTPAYOUT00000001/cancel');
    expect(request?.headers.get('Content-Type')).toBe('application/json');
    expect(payout.status).toBe('canceled');
  });
});
