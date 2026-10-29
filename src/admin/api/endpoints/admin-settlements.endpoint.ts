import type { ReconciliationItem, RetryReconciliationItemRequest } from '@payzeno/contracts';

import { newIdempotencyKey } from '@api/http/idempotency';
import { pathSegment } from '@api/http/request-builder';
import type { HttpTransport } from '@api/transport';

import type { AdminSettlementBacklog } from '../../types/settlement-backlog';

/**
 * `GET /v1/admin/settlements/backlog` and the existing
 * `POST /v1/settlements/:batchId/items/:itemId/retry` — `@StaffOnly('finance')` +
 * `@LivemodeOnly()` on the api, the same route `features/settlements/useRetrySettlementItem`
 * calls. `409 settlement_locked` is the normal outcome of racing the reconciliation sweep
 * (PAY-2043), not a failure; the hook above this treats it that way.
 *
 * The retry route is merchant-scoped: a staff session names the merchant it acts for with
 * `?merchant_id=` or the api answers 403. Unmatched items (no `merchant_id`) cannot be retried
 * from here.
 */
export class AdminSettlementsEndpoint {
  constructor(private readonly client: HttpTransport) {}

  backlog(): Promise<AdminSettlementBacklog> {
    return this.client.get<AdminSettlementBacklog>('/admin/settlements/backlog');
  }

  retryItem(
    batchId: string,
    itemId: string,
    merchantId: string,
    req: RetryReconciliationItemRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<ReconciliationItem> {
    return this.client.request<ReconciliationItem, RetryReconciliationItemRequest>({
      method: 'POST',
      path: `/settlements/${pathSegment(batchId)}/items/${pathSegment(itemId)}/retry`,
      query: { merchant_id: merchantId },
      body: req,
      idempotencyKey,
    });
  }
}
