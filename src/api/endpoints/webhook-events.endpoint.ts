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
