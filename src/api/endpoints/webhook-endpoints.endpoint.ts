import type {
  CreateWebhookEndpointRequest,
  Paginated,
  WebhookEndpoint,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

/**
 * `GET /v1/webhook_endpoints`, `POST /v1/webhook_endpoints`,
 * `DELETE /v1/webhook_endpoints/:endpointId` (api-surface.md §9).
 *
 * Not a `ResourceEndpoint`: there is no `GET /v1/webhook_endpoints/:id`, so a `get(id)`
 * inherited from the base would call a 404. Three cheap routes were added elsewhere to make
 * the base honest; here the honest answer was to stay off it.
 */
export class WebhookEndpointsEndpoint {
  constructor(private readonly client: HttpTransport) {}

  list(): Promise<Paginated<WebhookEndpoint>> {
    return this.client.get<Paginated<WebhookEndpoint>>('/webhook_endpoints');
  }

  /** The signing secret is returned once, here, and once again on rotation. */
  create(
    req: CreateWebhookEndpointRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<WebhookEndpoint> {
    return this.client.post<WebhookEndpoint, CreateWebhookEndpointRequest>(
      '/webhook_endpoints',
      req,
      idempotencyKey,
    );
  }

  remove(endpointId: string, idempotencyKey: string = newIdempotencyKey()): Promise<void> {
    return this.client.delete(
      `/webhook_endpoints/${encodeURIComponent(endpointId)}`,
      idempotencyKey,
    );
  }

  /** Endpoints that would receive a given event — used to explain a missing webhook. */
  static subscribedTo(
    endpoints: ReadonlyArray<WebhookEndpoint>,
    type: WebhookEndpoint['enabled_events'][number],
  ): WebhookEndpoint[] {
    return endpoints.filter((e) => e.status === 'enabled' && e.enabled_events.includes(type));
  }
}
