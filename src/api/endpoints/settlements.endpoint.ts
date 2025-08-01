import type {
  CurrencyCode,
  ListQuery,
  MerchantSettlementBatch,
  Paginated,
  ReconciliationItem,
  ReconciliationItemStatus,
  RetryReconciliationItemRequest,
  SettlementBatchStatus,
} from '@payzeno/contracts';

import { LONG_READ_TIMEOUT_MS } from '@config/constants';

import { newIdempotencyKey } from '../http/idempotency';
import { listQueryToParams } from '../transport';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

export interface SettlementListQuery extends ListQuery {
  currency?: CurrencyCode;
  status?: SettlementBatchStatus;
}

export interface SettlementItemListQuery extends ListQuery {
  status?: ReconciliationItemStatus;
}

/**
 * `GET /v1/settlements`, `GET /v1/settlements/:batchId`,
 * `GET /v1/settlements/:batchId/items`,
 * `POST /v1/settlements/:batchId/items/:itemId/retry` (api-surface.md §8).
 *
 * The list/detail resource is `MerchantSettlementBatch`, **not** `SettlementBatch`: a raw
 * batch is acquirer-level and carries every other merchant's totals. `expected_total_minor`
 * and `posted_total_minor` are never on a session-authed response, which is why
 * `BatchTotalsPanel` renders them from the item rollup rather than from the batch.
 */
export class SettlementsEndpoint extends ResourceEndpoint<
  MerchantSettlementBatch,
  SettlementListQuery
> {
  protected readonly basePath = '/settlements';

  constructor(client: HttpTransport) {
    super(client);
  }

  /**
   * arc PERF: this list is the one route with a 30s read timeout. Page size dropped 500 -> 50
   * and moved to cursor pagination after the ledger's `list_items` started timing out on
   * month-end batches.
   */
  listItems(
    batchId: string,
    q?: SettlementItemListQuery,
  ): Promise<Paginated<ReconciliationItem>> {
    return this.client.request<Paginated<ReconciliationItem>>({
      method: 'GET',
      path: this.resourcePath(batchId, 'items'),
      query: listQueryToParams(q),
      timeoutMs: LONG_READ_TIMEOUT_MS,
    });
  }

  /**
   * The arc-INC route. `staff('finance')` + `@LivemodeOnly()` on the API side; it reaches
   * `RetryScheduler.retry_item` in payzeno-ledger through
   * `POST /internal/v1/reconciliation/items/:itemId/retry`.
   *
   * Returns `202` with the current item. A `409 settlement_locked` is **not** a failure —
   * after PAY-2043 it is the normal outcome of racing the reconciliation sweep, and
   * `useRetrySettlementItem` treats it as a no-op.
   */
  retryItem(
    batchId: string,
    itemId: string,
    req: RetryReconciliationItemRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<ReconciliationItem> {
    return this.client.post<ReconciliationItem, RetryReconciliationItemRequest>(
      this.resourcePath(batchId, 'items', encodeURIComponent(itemId), 'retry'),
      req,
      idempotencyKey,
    );
  }
}
