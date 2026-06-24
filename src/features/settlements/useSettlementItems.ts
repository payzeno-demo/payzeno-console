/**
 * `useSettlementItems(batchId, q)` — `GET /v1/settlements/:batchId/items`.
 *
 * arc PERF lives here. This hook used to ask for 500 items in one page with the default
 * 10s read timeout; payzeno-api read through to the ledger's `settlements.list_items`, which
 * seq-scanned, and month-end batches timed out client-side while the query was still
 * running server-side. PAY-1918 dropped the page size to 50, moved to the cursor, and raised
 * this one route's read budget to 30s.
 *
 * It also derives the batch-level rollup the console is not allowed to read directly:
 * `expected_total_minor` / `posted_total_minor` are acquirer-level and never appear on a
 * session-authed response, so `BatchTotalsPanel` gets them from the items.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { ReconciliationItem, ReconciliationItemStatus } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import type { SettlementItemRow } from '@types/view-models';

import { settlementItemsQuery } from './settlements.queries';

export interface SettlementItemTotals {
  expectedMinor: number;
  postedMinor: number;
  feeMinor: number;
  varianceMinor: number;
  /** Items whose gross was posted more than once — the arc-INC signal. */
  duplicateCount: number;
}

export interface UseSettlementItemsResult {
  rows: SettlementItemRow[];
  totals: SettlementItemTotals;
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

/** Statuses `RetryScheduler.retry_item` will actually accept a claim for. */
const RETRYABLE_STATUSES: ReadonlySet<ReconciliationItemStatus> = new Set([
  'retryable',
  'failed',
]);

function toRow(item: ReconciliationItem): SettlementItemRow {
  return {
    ...item,
    _selected: false,
    _isRetryable: RETRYABLE_STATUSES.has(item.status),
    // A settled item that took more than one attempt is where a duplicate `settle`
    // transaction would have come from. PAY-2054's nightly audit checks the same thing
    // server-side; this is the merchant-visible half.
    _isDuplicateSuspect: item.status === 'settled' && item.attempt_count > 1,
  };
}

function rollUp(rows: ReadonlyArray<SettlementItemRow>): SettlementItemTotals {
  let expectedMinor = 0;
  let postedMinor = 0;
  let feeMinor = 0;
  let varianceMinor = 0;
  let duplicateCount = 0;

  for (const row of rows) {
    expectedMinor += row.expected_gross_minor ?? 0;
    if (row.status === 'settled') postedMinor += row.gross_minor;
    feeMinor += row.fee_minor;
    varianceMinor += row.variance_minor;
    if (row._isDuplicateSuspect) duplicateCount += 1;
  }

  return { expectedMinor, postedMinor, feeMinor, varianceMinor, duplicateCount };
}

