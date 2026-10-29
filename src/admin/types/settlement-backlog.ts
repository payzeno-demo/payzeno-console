/**
 * `GET /v1/admin/settlements/backlog`.
 *
 * The counts are the contracts' `ReconciliationBacklog` — what payzeno-ledger's
 * `GET /internal/v1/reconciliation/backlog` returns (`BacklogService.summary`). The two optional
 * extensions below are LOCAL, awaiting contracts:
 *
 *  - `buckets` mirrors `BacklogService.get_backlog()` (one row per batch × status), which the
 *    ledger computes but no contracts type describes yet;
 *  - `items` is what the finance retry button needs: a `ReconciliationItem` carries the
 *    `batch_id` + `id` pair that `POST /v1/settlements/:batchId/items/:itemId/retry` takes.
 *
 * The page renders whichever of the three the api sends. With counts alone, finance can still
 * retry by pasting a batch and item id.
 */
import type {
  CurrencyCode,
  IsoTimestamp,
  MinorUnits,
  ReconciliationBacklog,
  ReconciliationItem,
  ReconciliationItemStatus,
  SettlementBatchId,
} from '@payzeno/contracts';

/** One `(batch, status)` bucket — `BacklogService.get_backlog()["buckets"][n]`. */
export interface AdminBacklogBucket {
  batch_id: SettlementBatchId;
  currency: CurrencyCode;
  status: ReconciliationItemStatus;
  item_count: number;
  gross_minor: MinorUnits;
  oldest_next_attempt_at: IsoTimestamp | null;
}

export interface AdminSettlementBacklog extends ReconciliationBacklog {
  buckets?: AdminBacklogBucket[];
  items?: ReconciliationItem[];
}

/** The states only a person moves an item out of. Retrying them is still allowed. */
export const NEEDS_HUMAN_STATUSES: ReadonlyArray<ReconciliationItemStatus> = [
  'failed',
  'orphaned',
  'needs_review',
  'variance_exceeded',
];

/** Every item the backlog counts, retryable or not. */
export function backlogTotal(backlog: ReconciliationBacklog): number {
  return (
    backlog.retryable +
    backlog.failed +
    backlog.orphaned +
    backlog.needs_review +
    backlog.variance_exceeded
  );
}
