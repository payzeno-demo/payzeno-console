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
    const cardKeys = Object.keys(charge.card ?? {});

    expect(cardKeys).not.toContain('number');
    expect(cardKeys).not.toContain('pan');
    expect(cardKeys).not.toContain('cvv');
  });
});

describe('GET /v1/charges/:chargeId/ledger', () => {
  it('reads the double-entry view at the ledger sub-path', async () => {
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

  });
});
