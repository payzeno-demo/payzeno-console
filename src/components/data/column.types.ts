/**
 * The table's type surface.
 *
 * `ColumnDef<TRow>` and `DataTableProps<TRow>` are frozen (interfaces.md §4.2). They are
 * declared here and re-exported from `DataTable.tsx`, so both import paths resolve to one
 * declaration — `lib/csv.ts` needs the column shape without pulling in a React component.
 *
 * `caption` is **required**. It is the table's accessible name and there is no default that
 * would be honest.
 */
import type { ReactNode } from 'react';

export interface ColumnDef<TRow> {
  id: string;
  header: string;
  cell: (row: TRow) => ReactNode;
  align?: 'start' | 'end';
  width?: string;
  sortable?: boolean;
  /** Plain-text value for CSV export. Required when `cell` returns anything but a string. */
  exportValue?: (row: TRow) => string;
}

export interface DataTableProps<TRow> {
  columns: ReadonlyArray<ColumnDef<TRow>>;
  rows: ReadonlyArray<TRow>;
