/**
 * `ColumnDef<SettlementItemRow>[]` for a batch's reconciliation items.
 *
 * Renamed from `itemColumns.tsx` in the PAY-2043 PR, which is also when the duplicate column
 * was added (the-incident.md §8).
 *
 * The columns are deliberately close to the ledger's own vocabulary — `line_type`,
 * `match_method`, `variance_minor` — because when finance calls Payzeno about an item they
 * read these words down the phone and the on-call engineer needs to find the same row.
