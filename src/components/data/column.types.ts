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
  isLoading: boolean;
  emptyState: ReactNode;
  onRowClick?: (row: TRow) => void;
  /** a11y: required. Tal rejects PRs without it. */
  caption: string;
}

/** Stable row identity. Every payzeno resource has `id`; this is the escape hatch for the rest. */
export type RowKey<TRow> = (row: TRow) => string;

export function defaultRowKey<TRow extends { id: string }>(row: TRow): string {
  return row.id;
}

/** Column ids that never appear in an export. */
export const NON_EXPORTABLE_COLUMN_IDS: ReadonlyArray<string> = ['select', 'actions'];

export function isExportable<TRow>(column: ColumnDef<TRow>): boolean {
  return !NON_EXPORTABLE_COLUMN_IDS.includes(column.id);
}

/**
 * Build a column with less ceremony. Most columns are "read a field, render it as text", and
 * spelling out `cell` and `exportValue` for those is how columns files got to 200 lines.
 */
export function textColumn<TRow>(
  id: string,
  header: string,
  read: (row: TRow) => string | null,
  options: Partial<Pick<ColumnDef<TRow>, 'align' | 'width' | 'sortable'>> = {},
): ColumnDef<TRow> {
  return {
    id,
    header,
    cell: (row) => read(row) ?? '—',
    exportValue: (row) => read(row) ?? '',
    ...options,
  };
}

/** Numeric column: right-aligned by default, because a ragged number column is unreadable. */
export function numberColumn<TRow>(
  id: string,
  header: string,
  read: (row: TRow) => number,
  options: Partial<Pick<ColumnDef<TRow>, 'width' | 'sortable'>> = {},
): ColumnDef<TRow> {
  return {
    id,
    header,
    align: 'end',
    cell: (row) => read(row).toLocaleString(),
    exportValue: (row) => String(read(row)),
    ...options,
  };
}

/** Total declared width, used to decide whether the table needs horizontal scroll. */
export function totalWidth<TRow>(columns: ReadonlyArray<ColumnDef<TRow>>): string {
  const declared = columns.map((column) => column.width).filter(Boolean);
  return declared.length === columns.length ? declared.join(' + ') : 'auto';
}
