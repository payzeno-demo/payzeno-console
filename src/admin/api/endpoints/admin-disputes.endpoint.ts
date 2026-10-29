import type { Dispute, Paginated } from '@payzeno/contracts';

import { newIdempotencyKey } from '@api/http/idempotency';
import { pathSegment } from '@api/http/request-builder';
import type { HttpTransport } from '@api/transport';

import type { AdminDisputeListQuery } from '../../types/admin-views';

import { adminQueryParams } from './params';

/**
 * `GET /v1/admin/disputes` (every merchant) and the existing `POST /v1/disputes/:id/accept`,
 * which is `@StaffOnly('risk')` on the api. The merchant console deliberately has no accept
 * (`api/endpoints/disputes.endpoint.ts`): conceding a chargeback is a staff decision.
 *
 * Accepting is only legal from `needs_response` (the api's `DisputeStateMachine`); anything
 * else is a 409 `invalid_state`.
 *
 * `/v1/disputes/:id/accept` is a merchant-scoped route, so a staff session must say which
 * merchant it is acting for: `?merchant_id=` (the api's `MerchantScopeGuard` reads it into
 * `acting_merchant_id`). Without it the api answers 403.
 */
export class AdminDisputesEndpoint {
  constructor(private readonly client: HttpTransport) {}

  list(q?: AdminDisputeListQuery): Promise<Paginated<Dispute>> {
    return this.client.get<Paginated<Dispute>>('/admin/disputes', adminQueryParams(q));
  }

  accept(
    disputeId: string,
    merchantId: string,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<Dispute> {
    return this.client.request<Dispute, Record<string, never>>({
      method: 'POST',
      path: `/disputes/${pathSegment(disputeId)}/accept`,
      query: { merchant_id: merchantId },
      body: {},
      idempotencyKey,
    });
  }
}
