/**
 * `ColumnDef<SettlementItemRow>[]` for a batch's reconciliation items.
 *
 * Renamed from `itemColumns.tsx` in the PAY-2043 PR, which is also when the duplicate column
 * was added (the-incident.md §8).
 *
 * The columns are deliberately close to the ledger's own vocabulary — `line_type`,
 * `match_method`, `variance_minor` — because when finance calls Payzeno about an item they
 * read these words down the phone and the on-call engineer needs to find the same row.
 */
import type { ReconciliationItemStatus, ReconciliationLineType } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import type { SettlementItemRow } from '@types/view-models';

import { DuplicateBadge } from './components/DuplicateBadge';
import { RetryItemButton } from './components/RetryItemButton';

/** Lines that are not a sale never match a charge; `orphaned` on one of these is expected. */
const NON_SALE_LINE_TYPES: ReadonlySet<ReconciliationLineType> = new Set([
  'scheme_fee',
  'adjustment',
  'reserve_hold',
  'reserve_release',
