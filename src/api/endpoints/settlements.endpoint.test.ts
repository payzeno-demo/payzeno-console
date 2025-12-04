/**
 * `SettlementsEndpoint` — the arc-INC and arc-PERF endpoint.
 *
 * Two things here are load-bearing beyond the usual:
 *  - `listItems` must go through `client.request` with `LONG_READ_TIMEOUT_MS`, because the
 *    item list is the slowest read in the console (api-surface.md §11);
 *  - `retryItem` must build `/settlements/:batchId/items/:itemId/retry` exactly, and a
 *    `409 settlement_locked` must arrive as a `ConflictApiError` whose discriminator survives
 *    the mapper — that is what `useRetrySettlementItem` branches on.
 */
import { describe, expect, it, vi } from 'vitest';

import { ApiClient } from '@api/client';
import { ResourceEndpoint } from '@api/endpoints/base';
import { SettlementsEndpoint } from '@api/endpoints/settlements.endpoint';
import { ConflictApiError, NotFoundApiError } from '@api/errors';
import { LONG_READ_TIMEOUT_MS, SETTLEMENT_ITEM_PAGE_SIZE } from '@config/constants';
import type { HttpTransport, QueryParams, RequestSpec } from '@api/transport';
import { errorHandler, recordRequests, server } from '@/test/msw/server';

function endpoint(): SettlementsEndpoint {
  return new SettlementsEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly', () => {
    expect(Object.getPrototypeOf(SettlementsEndpoint)).toBe(ResourceEndpoint);
  });
});

describe('GET /v1/settlements', () => {
  it('lists batches', async () => {
    const page = await endpoint().list();

    expect(page.data.map((batch) => batch.status)).toEqual(['partially_reconciled', 'funded']);
  });

  it('filters by currency and status', async () => {
    const recorder = recordRequests();
    await endpoint().list({ currency: 'GBP', status: 'funded' });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('currency=GBP');
    expect(request?.url).toContain('status=funded');
  });
});

describe('GET /v1/settlements/:batchId', () => {
  it('reads one batch', async () => {
    const batch = await endpoint().get('sb_01HW0RTBATCH000000001');

    expect(batch.id).toBe('sb_01HW0RTBATCH000000001');
    expect(batch.acquirer).toBe('worldflow');
  });

  it('404s when the merchant has no item in the batch', async () => {
    server.use(errorHandler('get', '/settlements/:batchId', 404, 'not_found'));

    await expect(endpoint().get('sb_other_merchant')).rejects.toBeInstanceOf(NotFoundApiError);
  });
});

describe('GET /v1/settlements/:batchId/items', () => {
  it('reads the item list at the items sub-path', async () => {
    const recorder = recordRequests();
    const page = await endpoint().listItems('sb_01HW0RTBATCH000000001');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('/v1/settlements/sb_01HW0RTBATCH000000001/items');
    expect(page.data).toHaveLength(3);
  });

  it('passes LONG_READ_TIMEOUT_MS, not the default read timeout (arc PERF)', async () => {
    const specs: RequestSpec<unknown>[] = [];
    const spy: HttpTransport = {
      request: vi.fn(<TRes,>(spec: RequestSpec<unknown>) => {
        specs.push(spec);
        return Promise.resolve({ data: [], next_cursor: null, has_more: false } as TRes);
      }) as HttpTransport['request'],
      get: vi.fn(<TRes,>(_path: string, _query?: QueryParams) =>
        Promise.resolve(undefined as TRes),
      ) as HttpTransport['get'],
      post: vi.fn() as unknown as HttpTransport['post'],
      patch: vi.fn() as unknown as HttpTransport['patch'],
      delete: vi.fn() as unknown as HttpTransport['delete'],
    };

    await new SettlementsEndpoint(spy).listItems('sb_1', { limit: SETTLEMENT_ITEM_PAGE_SIZE });

    expect(specs).toHaveLength(1);
    expect(specs[0]?.timeoutMs).toBe(LONG_READ_TIMEOUT_MS);
    expect(specs[0]?.method).toBe('GET');
    expect(specs[0]?.path).toBe('/settlements/sb_1/items');
    expect(specs[0]?.query).toEqual({ limit: SETTLEMENT_ITEM_PAGE_SIZE });
  });

  it('asks for 50 rows, not 500 — the page size the regression fix settled on', async () => {
    const recorder = recordRequests();
    await endpoint().listItems('sb_1', { limit: SETTLEMENT_ITEM_PAGE_SIZE });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(SETTLEMENT_ITEM_PAGE_SIZE).toBe(50);
    expect(request?.url).toContain('limit=50');
  });

  it('returns the duplicate-suspect fingerprint untouched — settled after two attempts', async () => {
    const page = await endpoint().listItems('sb_01HW0RTBATCH000000001');
    const settled = page.data.find((item) => item.status === 'settled');

    expect(settled?.attempt_count).toBe(2);
    expect(settled?.settled_transaction_id).toBe('txn_01HW0RTLEDGERTXN000003');
  });
});

describe('POST /v1/settlements/:batchId/items/:itemId/retry', () => {
  it('builds the four-segment retry path exactly', async () => {
    const recorder = recordRequests();
    const item = await endpoint().retryItem(
      'sb_01HW0RTBATCH000000001',
      'ri_01HW0RTITEM00000000001',
      { reason: 'manual retry from console' },
    );

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.method).toBe('POST');
    expect(request?.url).toBe(
      'http://localhost/v1/settlements/sb_01HW0RTBATCH000000001/items/ri_01HW0RTITEM00000000001/retry',
    );
    expect(item.status).toBe('settling');
    expect(item.attempt_count).toBe(2);
  });

  it('accepts an empty request body — reason is optional', async () => {
    await expect(endpoint().retryItem('sb_1', 'ri_1', {})).resolves.toMatchObject({
      status: 'settling',
    });
  });

  it('carries settlement_locked through as a ConflictApiError with its discriminator', async () => {
    server.use(
      errorHandler(
        'post',
        '/settlements/:batchId/items/:itemId/retry',
        409,
        'settlement_locked',
        'A reconciliation sweep holds this batch.',
        { details: { item_id: 'ri_01HW0RTITEM00000000001' } },
      ),
    );

    const thrown = await endpoint()
      .retryItem('sb_1', 'ri_01HW0RTITEM00000000001', {})
      .catch((err: unknown) => err);

    expect(thrown).toBeInstanceOf(ConflictApiError);
    expect((thrown as ConflictApiError).isSettlementLocked()).toBe(true);
    expect((thrown as ConflictApiError).message).toContain('sweep');
  });

  it('does not repeat a 409 — a locked batch is an answer, not a hiccup', async () => {
    let calls = 0;
    server.use(
      errorHandler('post', '/settlements/:batchId/items/:itemId/retry', 409, 'settlement_locked'),
    );
    server.events.on('request:start', () => {
      calls += 1;
    });

    await endpoint()
      .retryItem('sb_1', 'ri_1', {})
      .catch(() => undefined);

    expect(calls).toBe(1);
    server.events.removeAllListeners('request:start');
  });
});
