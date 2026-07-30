/**
 * The one table.
 *
 * Every list feature renders this. It owns sorting (client-side, single key), the loading and
 * empty states, and the a11y contract that `DataTable.test.tsx` asserts:
 *
 *  - a real `<caption>` — required prop, no default;
 *  - `aria-sort` on the sorted header and nowhere else;
 *  - `aria-busy` while loading, with skeleton rows that are `aria-hidden`;
 *  - a row that is clickable is a `<button>` inside the first cell, not an `onClick` on
 *    `<tr>` — a div with a click handler is not reachable by keyboard, and rrefactor's first
 *    version of this file shipped exactly that (PAY-1712).
 *
 * Row virtualisation was added in PAY-1996, reverted in PAY-2001 when it broke the settlement
 * item table's sticky header, and re-added behind `VIRTUALISATION_THRESHOLD`.
 */
import { useMemo, useState } from 'react';

import { SKELETON_ROW_COUNT, VIRTUALISATION_THRESHOLD } from '@config/constants';
import { pz } from '@lib/cn';
import { ariaSort, sortRows, toggleDirection } from '@lib/sort';
import type { SortDirection, SortSpec } from '@lib/sort';

import { color, font, radius, space } from '../ui/tokens';

import { DataTableHeader } from './DataTableHeader';
import { DataTableRow } from './DataTableRow';
import { EmptyRows } from './EmptyRows';
import { RowSkeleton } from './RowSkeleton';
import { defaultRowKey } from './column.types';
import type { ColumnDef, DataTableProps } from './column.types';

export type { ColumnDef, DataTableProps } from './column.types';

/**
 * Sort rows by a column, using its `exportValue` as the sort key when it has one — that
 * function already knows how to reduce a cell to a comparable primitive.
 */
function sortSpecFor<TRow>(
  column: ColumnDef<TRow>,
  direction: SortDirection,
): SortSpec<TRow> {
  return {
    id: column.id,
    direction,
    value: (row) => (column.exportValue ? column.exportValue(row) : null),
  };
}

export function DataTable<TRow extends { id: string }>({
  columns,
  rows,
  isLoading,
  emptyState,
  onRowClick,
  caption,
}: DataTableProps<TRow>) {
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((candidate) => candidate.id === sort.columnId);
    if (!column) return rows;
    return sortRows(rows, sortSpecFor(column, sort.direction));
  }, [rows, columns, sort]);

  // Above the threshold we render a capped window. The full row count stays in the caption so
  // the user is not misled about how much data is behind the scroll.
  const windowed = sorted.length > VIRTUALISATION_THRESHOLD;
  const visible = windowed ? sorted.slice(0, VIRTUALISATION_THRESHOLD) : sorted;

  const activeSort: SortSpec<unknown> | null = sort
    ? { id: sort.columnId, direction: sort.direction, value: () => null }
    : null;

  function onSort(columnId: string): void {
    setSort((current) =>
      current?.columnId === columnId
        ? { columnId, direction: toggleDirection(current.direction) }
        : { columnId, direction: 'asc' },
    );
  }

  const isEmpty = !isLoading && sorted.length === 0;

  return (
    <div
      className={pz('data-table', 'scroller')}
      style={{ overflowX: 'auto', border: `1px solid ${color.border}`, borderRadius: radius.lg }}
    >
      <table
        className={pz('data-table')}
        aria-busy={isLoading || undefined}
        aria-rowcount={sorted.length}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: font.family,
          fontSize: font.size.md,
          background: color.surface,
        }}
      >
        <caption
          style={{
            captionSide: 'top',
            textAlign: 'start',
            padding: `${space[3]} ${space[4]}`,
            fontSize: font.size.sm,
            color: color.textSecondary,
          }}
        >
          {caption}
          {windowed ? ` — showing the first ${VIRTUALISATION_THRESHOLD} of ${sorted.length} rows` : null}
        </caption>

        <DataTableHeader
          columns={columns}
          sortedColumnId={sort?.columnId ?? null}
          ariaSortFor={(columnId) => ariaSort(columnId, activeSort)}
          onSort={onSort}
        />

        <tbody>
          {isLoading ? (
            <RowSkeleton columnCount={columns.length} rowCount={SKELETON_ROW_COUNT} />
          ) : isEmpty ? (
            <EmptyRows columnCount={columns.length}>{emptyState}</EmptyRows>
          ) : (
            visible.map((row) => (
              <DataTableRow
                key={defaultRowKey(row)}
                row={row}
                columns={columns}
                onRowClick={onRowClick}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
