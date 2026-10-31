/**
 * The cross-repo contract test (tests.md §4).
 *
 * Every path the endpoint classes build must exist in payzeno-api's checked-in OpenAPI
 * document (`src/api/openapi/payzeno-api.openapi.json`, refreshed by `pnpm openapi:pull` in
 * CI). This is the console's only guard against payzeno-api moving a route: TypeScript cannot
 * see a URL string, and MSW happily answers a handler we wrote ourselves.
 *
 * How it works: every method on every endpoint is invoked against a recording transport with
 * the sentinel id `ID`, both sides of the comparison are normalised so `/settlements/ID/items`
 * and `/v1/settlements/{batchId}/items` collapse onto the same shape, and the built path must
 * be a member of the document's set.
 *
 * When this fails, the fix is *not* to edit the expectation. Either payzeno-api renamed a
 * route (and the console has to follow) or the document is stale (`pnpm openapi:pull`).
 */
import { describe, expect, it } from 'vitest';

import openapi from '@api/openapi/payzeno-api.openapi.json';

import { createEndpoints } from '@api/endpoints/index';
import { StatementsEndpoint } from '@api/endpoints/statements.endpoint';
import type { HttpTransport, QueryParams, RequestSpec } from '@api/transport';
import { HANDLED_PATHS } from '@/test/msw/server';

const SENTINEL = 'ID';

/** `/v1/settlements/{batchId}/items` and `/settlements/ID/items` both become `/settlements/*​/items`. */
function normalise(path: string): string {
  return path
    .replace(/^\/v1/, '')
    .split('/')
    .map((segment) =>
      segment === SENTINEL || /^\{.+\}$/.test(segment) || /^:.+$/.test(segment)
        ? '*'
        : segment,
    )
    .join('/');
}

const DOCUMENTED: ReadonlySet<string> = new Set(
  Object.keys((openapi as { paths: Record<string, unknown> }).paths)
    .filter((path) => path.startsWith('/v1/'))
    .map(normalise),
);

interface Built {
  method: string;
  path: string;
}

class PathRecorder implements HttpTransport {
  readonly built: Built[] = [];

  request<TRes, TBody = unknown>(spec: RequestSpec<TBody>): Promise<TRes> {
    this.built.push({ method: spec.method, path: spec.path });
    return Promise.resolve(undefined as TRes);
  }

  get<TRes>(path: string, _query?: QueryParams): Promise<TRes> {
    this.built.push({ method: 'GET', path });
    return Promise.resolve({ data: [], next_cursor: null, has_more: false } as TRes);
  }

  post<TRes, TBody>(path: string, _body: TBody, _key: string): Promise<TRes> {
    this.built.push({ method: 'POST', path });
    return Promise.resolve({} as TRes);
  }

  patch<TRes, TBody>(path: string, _body: TBody, _key: string): Promise<TRes> {
    this.built.push({ method: 'PATCH', path });
    return Promise.resolve({} as TRes);
  }

  delete(path: string, _key: string): Promise<void> {
    this.built.push({ method: 'DELETE', path });
    return Promise.resolve();
  }
}

/** Drives every documented method on every endpoint in the registry, once. */
async function buildEveryPath(): Promise<Built[]> {
  const recorder = new PathRecorder();
  const e = createEndpoints(recorder);

  await e.auth.me();
  await e.auth.login({ email: 'a@b.c', password: 'x' });
  await e.auth.logout();
  await e.auth.requestPasswordReset('a@b.c');

  await e.paymentIntents.list();
  await e.paymentIntents.get(SENTINEL);
  await e.paymentIntents.capture(SENTINEL, {});
  await e.paymentIntents.cancel(SENTINEL, {});

  await e.charges.list();
  await e.charges.get(SENTINEL);
  await e.charges.ledger(SENTINEL);

  await e.refunds.list();
  await e.refunds.create({ charge_id: SENTINEL });

  await e.disputes.list();
  await e.disputes.get(SENTINEL);
  await e.disputes.submitEvidence(SENTINEL, { evidence: {}, submit: false });

  await e.balance.get('GBP');

  await e.payouts.list();
  await e.payouts.get(SENTINEL);
  await e.payouts.create({ currency: 'GBP' });
  await e.payouts.cancel(SENTINEL);

  await e.settlements.list();
  await e.settlements.get(SENTINEL);
  await e.settlements.listItems(SENTINEL);
  await e.settlements.retryItem(SENTINEL, SENTINEL, {});

  await e.invoices.list();
  await e.invoices.get(SENTINEL);

  await e.apiKeys.list();
  await e.apiKeys.get(SENTINEL);
  await e.apiKeys.create({ name: 'n', mode: 'test' });
  await e.apiKeys.revoke(SENTINEL);

  await e.bankAccounts.list();
  await e.bankAccounts.get(SENTINEL);
  await e.bankAccounts.create({
    bank_account_token: 't',
    currency: 'GBP',
    country: 'GB',
    scheme: 'uk_sort_code',
    account_holder_name: 'n',
  });
  await e.bankAccounts.makeDefault(SENTINEL);

  await e.webhookEvents.list();
  await e.webhookEvents.get(SENTINEL);
  await e.webhookEvents.redeliver(SENTINEL);

  await e.webhookEndpoints.list();
  await e.webhookEndpoints.create({ url: 'https://x', enabled_events: [] });
  await e.webhookEndpoints.remove(SENTINEL);

  await e.reporting.summary('7d', 'GBP');
  await e.reporting.volume({ interval: 'day', from: 'a', to: 'b', currency: 'GBP' });
  await e.reporting.balanceHistory({ interval: 'day', from: 'a', to: 'b', currency: 'GBP' });

  return recorder.built;
}

describe('the checked-in OpenAPI document', () => {
  it('is the version the console pins', () => {
    expect((openapi as { info: { version: string } }).info.version).toBe('2026-01-15');
  });

  it('documents a non-trivial number of /v1 routes — a truncated pull is a silent pass', () => {
    expect(DOCUMENTED.size).toBeGreaterThan(30);
  });
});

describe('every endpoint path exists in payzeno-api', () => {
  it('builds at least one path per endpoint method', async () => {
    const built = await buildEveryPath();

    expect(built.length).toBeGreaterThanOrEqual(40);
  });

  it('finds each built path in the document', async () => {
    const built = await buildEveryPath();
    const missing = built
      .map((call) => ({ ...call, normalised: normalise(call.path) }))
      .filter((call) => !DOCUMENTED.has(call.normalised));

    expect(missing.map((call) => `${call.method} ${call.path}`)).toEqual([]);
  });

  it('covers the whole registry, not a lucky subset', async () => {
    const built = await buildEveryPath();
    const roots = new Set(built.map((call) => normalise(call.path).split('/')[1]));

    expect([...roots].sort()).toEqual([
      'api-keys',
      'auth',
      'balance',
      'bank-accounts',
      'charges',
      'disputes',
      'invoices',
      'payment_intents',
      'payouts',
      'refunds',
      'reporting',
      'settlements',
      'webhook_endpoints',
      'webhook_events',
    ]);
  });
});

describe('the MSW handler set tracks the same routes', () => {
  it('registers a handler for every path an endpoint builds', async () => {
    const handled = new Set(HANDLED_PATHS.map(normalise));
    const built = await buildEveryPath();

    // Four routes are deliberately unhandled: they are reachable from an endpoint class but
    // no feature calls them, so no test needs a fixture. Everything else must be answerable,
    // or a hook test would hit `onUnhandledRequest: 'error'` for reasons that look unrelated.
    const knownGaps = new Set(
      [
        '/auth/password/reset',
        '/api-keys/*',
        '/bank-accounts/*/default',
        '/webhook_endpoints/*',
        '/webhook_events/*/redeliver',
      ].map(normalise),
    );

    const unhandled = [
      ...new Set(built.map((call) => normalise(call.path))),
    ].filter((path) => !handled.has(path) && !knownGaps.has(path));

    expect(unhandled).toEqual([]);
  });
});

describe('dead code stays dead', () => {
  it('StatementsEndpoint points at a route the ledger took over — it is not in the document', () => {
    // blueprint §8.4: `GET /v1/statements` moved to the ledger in MIG step 2 and the class was
    // never deleted. This assertion is the receipt: if the route ever comes back, delete the
    // assertion *and* give the class an importer, or delete the class.
    expect(DOCUMENTED.has('/statements')).toBe(false);
    expect(StatementsEndpoint.name).toBe('StatementsEndpoint');
  });
});
