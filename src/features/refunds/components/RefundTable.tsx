/**
 * The refunds list table. Presentational — rows in, table out.
 *
 * a11y: `caption` is required by `DataTableProps` and it describes the ordering, because a
 * screen-reader user cannot see that the first row is the most recent one.
 */
import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import type { Pagination } from '@hooks/usePagination';
import type { RefundRow } from '@/types/view-models';

import { refundColumns } from '../refunds.columns';

export interface RefundTableProps {
  rows: ReadonlyArray<RefundRow>;
  isLoading: boolean;
  pagination?: Pagination;
  /** Set on the charge detail panel, where the charge column is redundant. */
  hideChargeColumn?: boolean;
}

