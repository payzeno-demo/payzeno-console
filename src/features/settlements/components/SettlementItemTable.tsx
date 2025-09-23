/**
 * The per-batch item table. Frame 3 of the canonical chain — it renders `RetryItemButton`
 * via `settlementItemColumns(batchId)`.
 *
 * The status filter is a segmented control over the statuses finance actually filters on;
 * `settling` is deliberately in the list because during an incident that is the one people
