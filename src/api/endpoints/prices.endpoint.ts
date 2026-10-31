import type { CreatePriceRequest, ListQuery, Price } from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

/**
 * `GET/POST /v1/prices`, `GET /v1/prices/:priceId` (RFC platform-v2 §6).
 *
 * A price with `recurring: null` is one-off (checkout `payment` mode); only a recurring price
 * can start a subscription. Prices are immutable once created — there is no PATCH.
 */
export class PricesEndpoint extends ResourceEndpoint<Price, ListQuery> {
  protected readonly basePath = '/prices';

  constructor(client: HttpTransport) {
    super(client);
  }

  create(req: CreatePriceRequest, idempotencyKey: string = newIdempotencyKey()): Promise<Price> {
    return this.client.post<Price, CreatePriceRequest>(this.basePath, req, idempotencyKey);
  }
}
