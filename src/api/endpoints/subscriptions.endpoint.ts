import type {
  CancelSubscriptionRequest,
  CreateSubscriptionRequest,
  Subscription,
  SubscriptionListQuery,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

/**
 * `GET/POST /v1/subscriptions`, `GET /v1/subscriptions/:subscriptionId`,
 * `POST /v1/subscriptions/:subscriptionId/cancel` (RFC platform-v2 §6).
 *
 * These are `csub_` — a merchant billing *their* customers. Not billing-legacy's `sub_`, which
 * is Payzeno billing the merchant and surfaces in the console only as an invoice field.
 */
export class SubscriptionsEndpoint extends ResourceEndpoint<Subscription, SubscriptionListQuery> {
  protected readonly basePath = '/subscriptions';

  constructor(client: HttpTransport) {
    super(client);
  }

  create(
    req: CreateSubscriptionRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<Subscription> {
    return this.client.post<Subscription, CreateSubscriptionRequest>(
      this.basePath,
      req,
      idempotencyKey,
    );
  }

  /** `at_period_end` defaults to true on the api: the customer keeps what they paid for. */
  cancel(
    subscriptionId: string,
    req: CancelSubscriptionRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<Subscription> {
    return this.client.post<Subscription, CancelSubscriptionRequest>(
      this.resourcePath(subscriptionId, 'cancel'),
      req,
      idempotencyKey,
    );
  }
}
