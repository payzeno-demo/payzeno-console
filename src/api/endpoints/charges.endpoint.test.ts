/**
 * `ChargesEndpoint` — list, get, and the ledger read that arc MIG step 2 added.
 */
import { describe, expect, it } from 'vitest';

import { ApiClient } from '@api/client';
import { ResourceEndpoint } from '@api/endpoints/base';
import { ChargesEndpoint } from '@api/endpoints/charges.endpoint';
import { UpstreamUnavailableApiError } from '@api/errors';
import { errorHandler, recordRequests, server } from '@/test/msw/server';

function endpoint(): ChargesEndpoint {
  return new ChargesEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly', () => {
    expect(Object.getPrototypeOf(ChargesEndpoint)).toBe(ResourceEndpoint);
    expect(endpoint()).toBeInstanceOf(ResourceEndpoint);
  });
});

describe('GET /v1/charges', () => {
  it('returns the fixture page, statuses and all', async () => {
    const page = await endpoint().list();

    expect(page.data.map((charge) => charge.status)).toEqual(['captured', 'settled', 'failed']);
  });

  it('carries a JPY charge through untouched — the console does no money arithmetic', async () => {
    const page = await endpoint().list();
    const jpy = page.data.find((charge) => charge.currency === 'JPY');

    expect(jpy?.amount_minor).toBe(1_200);
    expect(jpy?.captured_amount_minor).toBe(1_200);
  });

  it('serialises the sort and status filter that produced migration 14', async () => {
    const recorder = recordRequests();
    await endpoint().list({ status: 'captured', limit: 25 });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('/v1/charges?');
    expect(request?.url).toContain('status=captured');
    expect(request?.url).toContain('limit=25');
  });
});

describe('listForBatch', () => {
  it('adds settlement_batch_id to the query without losing the caller filters', async () => {
    const recorder = recordRequests();
    await endpoint().listForBatch('sb_01HW0RTBATCH000000001', { limit: 100 });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('settlement_batch_id=sb_01HW0RTBATCH000000001');
    expect(request?.url).toContain('limit=100');
  });

  it('works with no extra filters at all', async () => {
    const recorder = recordRequests();
    await endpoint().listForBatch('sb_01HW0RTBATCH000000002');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('settlement_batch_id=sb_01HW0RTBATCH000000002');
  });
});

describe('GET /v1/charges/:chargeId', () => {
  it('reads one charge by id', async () => {
    const charge = await endpoint().get('ch_01HW0RTCHARGE00000001');

    expect(charge.id).toBe('ch_01HW0RTCHARGE00000001');
    expect(charge.card?.last_four).toBe('4242');
  });

  it('never exposes anything more of the card than the summary', async () => {
    const charge = await endpoint().get('ch_01HW0RTCHARGE00000001');
    const cardKeys = Object.keys(charge.card ?? {});

    expect(cardKeys).not.toContain('number');
    expect(cardKeys).not.toContain('pan');
    expect(cardKeys).not.toContain('cvv');
  });
});

describe('GET /v1/charges/:chargeId/ledger', () => {
  it('reads the double-entry view at the ledger sub-path', async () => {
    const recorder = recordRequests();
    const ledger = await endpoint().ledger('ch_01HW0RTCHARGE00000001');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toBe('http://localhost/v1/charges/ch_01HW0RTCHARGE00000001/ledger');
    expect(ledger.transactions.map((t) => t.purpose)).toEqual(['authorize', 'capture']);
  });

  it('propagates a 502 as UpstreamUnavailableApiError — the ledger is a separate service', async () => {
    server.use(errorHandler('get', '/charges/:chargeId/ledger', 502, 'processor_unavailable'));

    await expect(endpoint().ledger('ch_1')).rejects.toBeInstanceOf(UpstreamUnavailableApiError);
  });

  it('encodes the charge id in the sub-resource path', async () => {
    const recorder = recordRequests();
    await endpoint()
      .ledger('ch with space')
      .catch(() => undefined);

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('ch%20with%20space/ledger');
  });
});
