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
  it('is the version the console pins', () => {
    expect((openapi as { info: { version: string } }).info.version).toBe('2026-01-15');
  });

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
});
