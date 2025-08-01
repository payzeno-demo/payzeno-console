import type {
  CreateRefundRequest,
  ListQuery,
  Refund,
  RefundResponse,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

/** `GET /v1/refunds` also accepts a `charge_id` filter (api-surface.md §7). */
export interface RefundListQuery extends ListQuery {
  charge_id?: string;
}

/**
 * `POST /v1/refunds` rejects an `authorized` (uncaptured) charge with `409 invalid_state` —
 * that case belongs to `PaymentIntentsEndpoint.cancel`. Past `REFUND_WINDOW_DAYS` it answers
 * `422 refund_window_closed`, which `RefundDialog` renders inline.
 */
export class RefundsEndpoint extends ResourceEndpoint<Refund, RefundListQuery> {
  protected readonly basePath = '/refunds';

  constructor(client: HttpTransport) {
    super(client);
  }

  create(
    req: CreateRefundRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<RefundResponse> {
    return this.client.post<RefundResponse, CreateRefundRequest>(
      this.basePath,
      req,
      idempotencyKey,
    );
  }

  listForCharge(chargeId: string, q?: ListQuery) {
    return this.list({ ...(q ?? {}), charge_id: chargeId });
  }
}
