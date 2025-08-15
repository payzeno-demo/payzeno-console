/**
 * `ResourceEndpoint` — the abstract base the ten concretes extend *directly*
 * (interfaces.md §4.2).
 *
 * The concrete used here is local to the test on purpose: the ten real subclasses each have
 * their own file, and what this one proves is the base's own behaviour — path building,
 * parameter serialisation and sub-resource paths — without any of them in the way.
 */
import { describe, expect, it } from 'vitest';

import type { ListQuery, Paginated } from '@payzeno/contracts';

import { ResourceEndpoint } from '@api/endpoints/base';
import type { HttpTransport, QueryParams, RequestSpec } from '@api/transport';

interface Widget {
  id: string;
  name: string;
}

interface WidgetListQuery extends ListQuery {
  status?: 'live' | 'retired';
}

interface RecordedCall {
  method: string;
  path: string;
  query?: QueryParams;
  body?: unknown;
  idempotencyKey?: string;
}

/**
 * A transport that answers everything and remembers what it was asked. Not a mock of the
 * endpoint — the endpoint under test is real, this stands in for the socket.
 */
class RecordingTransport implements HttpTransport {
  readonly calls: RecordedCall[] = [];

  request<TRes, TBody = unknown>(spec: RequestSpec<TBody>): Promise<TRes> {
    this.calls.push({
      method: spec.method,
      path: spec.path,
      query: spec.query,
      body: spec.body,
      idempotencyKey: spec.idempotencyKey,
    });
    return Promise.resolve(undefined as TRes);
  }

  get<TRes>(path: string, query?: QueryParams): Promise<TRes> {
    this.calls.push({ method: 'GET', path, query });
    return Promise.resolve({ data: [], next_cursor: null, has_more: false } as TRes);
  }

  post<TRes, TBody>(path: string, body: TBody, idempotencyKey: string): Promise<TRes> {
    this.calls.push({ method: 'POST', path, body, idempotencyKey });
    return Promise.resolve({ id: 'created' } as TRes);
  }

  patch<TRes, TBody>(path: string, body: TBody, idempotencyKey: string): Promise<TRes> {
    this.calls.push({ method: 'PATCH', path, body, idempotencyKey });
    return Promise.resolve({ id: 'patched' } as TRes);
  }

  delete(path: string, idempotencyKey: string): Promise<void> {
    this.calls.push({ method: 'DELETE', path, idempotencyKey });
    return Promise.resolve();
  }

  last(): RecordedCall {
    const call = this.calls.at(-1);
    if (!call) throw new Error('The endpoint never reached the transport.');
    return call;
  }
}

class WidgetsEndpoint extends ResourceEndpoint<Widget, WidgetListQuery> {
  protected readonly basePath = '/widgets';

  constructor(client: HttpTransport) {
    super(client);
  }

  /** Exercises `resourcePath` with a suffix, the way `SettlementsEndpoint.listItems` does. */
  parts(widgetId: string): Promise<Paginated<Widget>> {
    return this.client.get<Paginated<Widget>>(this.resourcePath(widgetId, 'parts'));
  }

  deep(widgetId: string, partId: string): Promise<Widget> {
    return this.client.get<Widget>(this.resourcePath(widgetId, 'parts', partId, 'history'));
  }
}

describe('ResourceEndpoint.list', () => {
  it('gets the base path with no parameters when the query is omitted', async () => {
    const transport = new RecordingTransport();
    await new WidgetsEndpoint(transport).list();

    expect(transport.last()).toMatchObject({ method: 'GET', path: '/widgets', query: {} });
  });

  it('flattens the list query onto the parameters', async () => {
    const transport = new RecordingTransport();
    await new WidgetsEndpoint(transport).list({ limit: 50, status: 'live' });

    expect(transport.last().query).toEqual({ limit: 50, status: 'live' });
  });

  it('drops undefined and null values so no request carries `?status=undefined`', async () => {
    const transport = new RecordingTransport();
    await new WidgetsEndpoint(transport).list({
      limit: 25,
      cursor: undefined,
      status: undefined,
    });

    expect(transport.last().query).toEqual({ limit: 25 });
  });

  it('returns the envelope the transport produced', async () => {
    const page = await new WidgetsEndpoint(new RecordingTransport()).list();

    expect(page).toEqual({ data: [], next_cursor: null, has_more: false });
  });
});

describe('ResourceEndpoint.get', () => {
  it('appends the id to the base path', async () => {
    const transport = new RecordingTransport();
    await new WidgetsEndpoint(transport).get('wid_123');

    expect(transport.last().path).toBe('/widgets/wid_123');
  });

  it('percent-encodes an id so a slash cannot forge a path segment', async () => {
    const transport = new RecordingTransport();
    await new WidgetsEndpoint(transport).get('wid/../admin');

    expect(transport.last().path).toBe('/widgets/wid%2F..%2Fadmin');
  });

  it('sends no query parameters on a detail read', async () => {
    const transport = new RecordingTransport();
    await new WidgetsEndpoint(transport).get('wid_123');

    expect(transport.last().query).toBeUndefined();
  });
});

describe('resourcePath suffixes', () => {
  it('builds a one-level sub-resource path', async () => {
    const transport = new RecordingTransport();
    await new WidgetsEndpoint(transport).parts('wid_123');

    expect(transport.last().path).toBe('/widgets/wid_123/parts');
  });

  it('joins several suffix segments with slashes', async () => {
    const transport = new RecordingTransport();
    await new WidgetsEndpoint(transport).deep('wid_123', 'part_9');

    expect(transport.last().path).toBe('/widgets/wid_123/parts/part_9/history');
  });
});

describe('the base as a type boundary', () => {
  it('exposes exactly the two contracted read methods on the base itself', () => {
    const prototype = ResourceEndpoint.prototype as unknown as Record<string, unknown>;

    expect(typeof prototype.list).toBe('function');
    expect(typeof prototype.get).toBe('function');
    // `create`, `capture`, `retryItem` and friends belong to the concretes, not here.
    expect(prototype.create).toBeUndefined();
  });

  it('holds the transport it was constructed with, and only that', async () => {
    const first = new RecordingTransport();
    const second = new RecordingTransport();

    await new WidgetsEndpoint(first).list();

    expect(first.calls).toHaveLength(1);
    expect(second.calls).toHaveLength(0);
  });
});
