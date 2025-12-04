/**
 * `MockTransport` — the second production implementation of `HttpTransport` (interfaces.md
 * §4.2), selected by `TransportProvider` on `?mock=1`. Sales demos run on it, so a break here
 * is a break in front of a prospect, which is exactly why it is tested at all despite living
 * under `api/mock/`.
 *
 * The contract this file holds it to: **every endpoint class must work against it unchanged**.
 * So the cases below go through the real endpoint registry rather than calling `get()` by
 * hand — if a path were only reachable from `ApiClient`, that would show up here.
 */
import { describe, expect, it } from 'vitest';

import { createEndpoints } from '@api/endpoints/index';
import { NotFoundApiError } from '@api/errors';
import { MockTransport } from '@api/mock/mock-transport';
import {
  mockCharges,
  mockPayouts,
  mockSettlementItems,
  mockSettlements,
} from '@api/mock/fixtures';
import type { HttpTransport } from '@api/transport';

function registry() {
  return createEndpoints(new MockTransport());
}

describe('interface conformance', () => {
  it('implements every method HttpTransport declares', () => {
    const transport: HttpTransport = new MockTransport();

    expect(typeof transport.request).toBe('function');
    expect(typeof transport.get).toBe('function');
    expect(typeof transport.post).toBe('function');
    expect(typeof transport.patch).toBe('function');
    expect(typeof transport.delete).toBe('function');
  });

  it('can be handed to createEndpoints in place of ApiClient', () => {
    const endpoints = registry();

    expect(Object.keys(endpoints)).toHaveLength(14);
    expect(endpoints.settlements).toBeDefined();
    expect(endpoints.reporting).toBeDefined();
  });
});

describe('reads through the endpoint registry', () => {
  it('answers GET /auth/me with the demo session', async () => {
    const session = await registry().auth.me();

    expect(session.object).toBe('session');
    expect(session.merchant.id).toBe(session.user.merchant_id);
  });

  it('answers a list with the full fixture set in an envelope', async () => {
    const page = await registry().charges.list();

    expect(page.data).toHaveLength(mockCharges.length);
    expect(page.has_more).toBe(false);
    expect(page.next_cursor).toBeNull();
  });

  it('answers a detail read by id', async () => {
    const first = mockPayouts[0];
    expect(first).toBeDefined();

    const payout = await registry().payouts.get(first!.id);

    expect(payout.id).toBe(first!.id);
  });

  it('resolves the settlement item sub-path rather than treating `items` as an id', async () => {
    const batch = mockSettlements[0];
    expect(batch).toBeDefined();

    const page = await registry().settlements.listItems(batch!.id);

    expect(page.data).toHaveLength(mockSettlementItems.length);
  });

  it('resolves the charge ledger sub-path', async () => {
    const charge = mockCharges[0];
    const ledger = await registry().charges.ledger(charge!.id);

    expect(ledger.charge_id).toBe(charge!.id);
    expect(ledger.transactions).toEqual([]);
  });

  it('answers the three reporting reads', async () => {
    const endpoints = registry();

    await expect(endpoints.reporting.summary('7d', 'GBP')).resolves.toMatchObject({
      object: 'dashboard_summary',
    });
    await expect(
      endpoints.reporting.volume({ interval: 'day', from: 'a', to: 'b', currency: 'GBP' }),
    ).resolves.toMatchObject({ object: 'volume_timeseries' });
    await expect(
      endpoints.reporting.balanceHistory({
        interval: 'day',
        from: 'a',
        to: 'b',
        currency: 'GBP',
      }),
    ).resolves.toHaveProperty('points');
  });
});

describe('unknown paths', () => {
  it('throws a real NotFoundApiError, not a bare Error', async () => {
    const thrown = await new MockTransport()
      .get('/unicorns')
      .catch((err: unknown) => err);

    expect(thrown).toBeInstanceOf(NotFoundApiError);
    expect((thrown as NotFoundApiError).status).toBe(404);
    expect((thrown as NotFoundApiError).message).toContain('/unicorns');
  });

  it('throws NotFoundApiError for an id that is not in the fixture set', async () => {
    await expect(registry().charges.get('ch_does_not_exist')).rejects.toBeInstanceOf(
      NotFoundApiError,
    );
  });
});

describe('writes', () => {
  it('creates a refund derived from the charge it names', async () => {
    const charge = mockCharges[0];
    const refund = await registry().refunds.create({
      charge_id: charge!.id,
      amount_minor: 500,
    });

    expect(refund.charge_id).toBe(charge!.id);
    expect(refund.amount_minor).toBe(500);
    expect(refund.currency).toBe(charge!.currency);
  });

  it('cancels a payout by moving its status, leaving the fixture set immutable', async () => {
    const payout = mockPayouts[0];
    const canceled = await registry().payouts.cancel(payout!.id);

    expect(canceled.status).toBe('canceled');
    // Re-reading gives the original back: the demo is re-runnable without a reload.
    await expect(registry().payouts.get(payout!.id)).resolves.toMatchObject({
      status: payout!.status,
    });
  });

  it('accepts a delete and discards it', async () => {
    await expect(new MockTransport().delete('/api-keys/key_1', 'k')).resolves.toBeUndefined();
  });

  it('routes `request()` to the right verb handler', async () => {
    const transport = new MockTransport();

    await expect(transport.request({ method: 'GET', path: '/balance' })).resolves.toHaveProperty(
      'available_minor',
    );
    await expect(
      transport.request({ method: 'DELETE', path: '/api-keys/key_1', idempotencyKey: 'k' }),
    ).resolves.toBeUndefined();
  });
});

describe('the settlement retry — the arc-INC demo path', () => {
  it('either queues the retry or refuses with settlement_locked, and never anything else', async () => {
    const endpoints = registry();

    for (const item of mockSettlementItems) {
      const outcome = await endpoints.settlements
        .retryItem(item.batch_id, item.id, {})
        .then((settled) => ({ ok: true as const, settled }))
        .catch((error: unknown) => ({ ok: false as const, error }));

      if (outcome.ok) {
        expect(outcome.settled.status).toBe('settling');
        expect(outcome.settled.attempt_count).toBe(item.attempt_count + 1);
      } else {
        expect(outcome.error).toMatchObject({ status: 409, code: 'settlement_locked' });
      }
    }
  });

  it('is deterministic — the same item gives the same answer twice', async () => {
    const item = mockSettlementItems[0];
    expect(item).toBeDefined();

    const first = await registry()
      .settlements.retryItem(item!.batch_id, item!.id, {})
      .then(() => 'ok')
      .catch(() => 'locked');
    const second = await registry()
      .settlements.retryItem(item!.batch_id, item!.id, {})
      .then(() => 'ok')
      .catch(() => 'locked');

    expect(second).toBe(first);
  });
});
