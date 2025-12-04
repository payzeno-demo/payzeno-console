/**
 * `WebhookEventsEndpoint` — the developers tab's delivery log.
 */
import { describe, expect, it } from 'vitest';

import { ApiClient } from '@api/client';
import { ResourceEndpoint } from '@api/endpoints/base';
import { WebhookEventsEndpoint } from '@api/endpoints/webhook-events.endpoint';
import { NotFoundApiError } from '@api/errors';
import { HEADER_IDEMPOTENCY_KEY } from '@api/http/headers';
import { errorHandler, recordRequests, server } from '@/test/msw/server';

function endpoint(): WebhookEventsEndpoint {
  return new WebhookEventsEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly', () => {
    expect(Object.getPrototypeOf(WebhookEventsEndpoint)).toBe(ResourceEndpoint);
  });
});

describe('GET /v1/webhook_events', () => {
  it('lists deliveries, including a dead one with its last error', async () => {
    const page = await endpoint().list();
    const dead = page.data.find((event) => event.status === 'dead');

    expect(dead?.attempt_count).toBe(8);
    expect(dead?.last_error).toBe('connect ETIMEDOUT');
    expect(dead?.delivered_at).toBeNull();
  });

  it('filters by status and event type', async () => {
    const recorder = recordRequests();
    await endpoint().list({ status: 'dead', type: 'payout.failed' });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('status=dead');
    expect(request?.url).toContain('type=payout.failed');
  });

  it('listDead is the same read with the status pinned', async () => {
    const recorder = recordRequests();
    await endpoint().listDead({ limit: 50 });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('status=dead');
    expect(request?.url).toContain('limit=50');
  });

  it('uses the underscored path — webhook_events, not webhook-events', async () => {
    const recorder = recordRequests();
    await endpoint().list();

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('/v1/webhook_events');
  });
});

describe('GET /v1/webhook_events/:eventId', () => {
  it('reads one delivery with its payload', async () => {
    const event = await endpoint().get('evt_01HW0RTWEBHOOKEVENT001');

    expect(event.id).toBe('evt_01HW0RTWEBHOOKEVENT001');
    expect(event.type).toBe('payment.captured');
    expect(event.last_response_status).toBe(200);
  });

  it('maps a missing event onto NotFoundApiError', async () => {
    server.use(errorHandler('get', '/webhook_events/:eventId', 404, 'not_found'));

    await expect(endpoint().get('evt_missing')).rejects.toBeInstanceOf(NotFoundApiError);
  });
});

describe('POST /v1/webhook_events/:eventId/redeliver', () => {
  it('posts to the redeliver sub-path with an idempotency key', async () => {
    server.use(
      errorHandler('post', '/webhook_events/:eventId/redeliver', 202, 'accepted', 'queued'),
    );

    const recorder = recordRequests();
    await endpoint()
      .redeliver('evt_01HW0RTWEBHOOKEVENT002')
      .catch(() => undefined);

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.method).toBe('POST');
    expect(request?.url).toBe(
      'http://localhost/v1/webhook_events/evt_01HW0RTWEBHOOKEVENT002/redeliver',
    );
    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toBeTruthy();
  });

  it('honours a supplied key so a double-click redelivers once', async () => {
    server.use(
      errorHandler('post', '/webhook_events/:eventId/redeliver', 202, 'accepted', 'queued'),
    );

    const recorder = recordRequests();
    await endpoint()
      .redeliver('evt_1', 'redeliver-attempt-3')
      .catch(() => undefined);

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toBe('redeliver-attempt-3');
  });
});
