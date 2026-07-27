import type {
  ListQuery,
  PublicEventType,
  WebhookEvent,
  WebhookEventStatus,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

export interface WebhookEventListQuery extends ListQuery {
  status?: WebhookEventStatus;
  type?: PublicEventType;
}

/**
 * `GET /v1/webhook_events`, `GET /v1/webhook_events/:eventId`,
 * `POST /v1/webhook_events/:eventId/redeliver` (api-surface.md §9).
 *
 * Rows are produced by payzeno-api's `WebhookFanoutConsumer`, deduped on
 * `(endpoint_id, source_event_id)` — the bus is at-least-once, so a redelivered
 * `payout.failed` must not send the merchant a second webhook.
 */
export class WebhookEventsEndpoint extends ResourceEndpoint<WebhookEvent, WebhookEventListQuery> {
  protected readonly basePath = '/webhook_events';

  constructor(client: HttpTransport) {
    super(client);
  }

  /** `admin` for the merchant's own events. Returns the event with a fresh attempt queued. */
  redeliver(
    eventId: string,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<WebhookEvent> {
    return this.client.post<WebhookEvent, Record<string, never>>(
      this.resourcePath(eventId, 'redeliver'),
      {},
      idempotencyKey,
    );
  }

  listDead(q?: ListQuery) {
    return this.list({ ...(q ?? {}), status: 'dead' });
  }
}
