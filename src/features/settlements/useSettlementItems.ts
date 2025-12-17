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
