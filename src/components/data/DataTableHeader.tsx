/**
 * Table header row.
 *
 * A sortable header is a `<button>` inside the `<th>`, not a click handler on the `<th>`: the
 * cell needs to stay a table header for the accessibility tree, and the control needs to be
 * focusable. `aria-sort` goes on the `<th>`, per the ARIA spec, and on exactly one at a time.
 */
import { pz } from '@lib/cn';

import { color, font, space } from '../ui/tokens';

import type { ColumnDef } from './column.types';

export interface DataTableHeaderProps<TRow> {
  columns: ReadonlyArray<ColumnDef<TRow>>;
  sortedColumnId: string | null;
  ariaSortFor: (columnId: string) => 'ascending' | 'descending' | 'none';
  onSort: (columnId: string) => void;
}

export function DataTableHeader<TRow>({
  columns,
  sortedColumnId,
  ariaSortFor,
  onSort,
}: DataTableHeaderProps<TRow>) {
  return (
    <thead className={pz('data-table', 'head')}>
      <tr>
        {columns.map((column) => {
          const sortState = ariaSortFor(column.id);
          const isSorted = sortedColumnId === column.id;

          return (
            <th
              key={column.id}
              scope="col"
              aria-sort={column.sortable ? sortState : undefined}
              style={{
                position: 'sticky',
                top: 0,
                width: column.width,
                textAlign: column.align === 'end' ? 'right' : 'left',
                padding: `${space[2]} ${space[4]}`,
                fontSize: font.size.sm,
                fontWeight: font.weight.semibold,
                color: color.textSecondary,
                background: color.surfaceMuted,
                borderBottom: `1px solid ${color.border}`,
                whiteSpace: 'nowrap',
              }}
            >
              {column.sortable ? (
                <button
                  type="button"
                  onClick={() => onSort(column.id)}
                  className={pz('data-table', 'sort')}
                  style={{
