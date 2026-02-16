/**
 * One table row.
 *
 * When the table is navigable, the first cell holds a real `<button>` that carries the row's
 * action, and the `<tr>` gets a click handler *as well* for pointer users. The button is what
 * makes the row reachable by keyboard; the row handler is a convenience on top of it, and it
 * ignores clicks that originated inside another interactive element (a row-action menu inside
 * a clickable row would otherwise navigate and open the menu at once).
 */
import type { MouseEvent } from 'react';

import { pz } from '@lib/cn';

import { color, font, space } from '../ui/tokens';

import type { ColumnDef } from './column.types';

export interface DataTableRowProps<TRow> {
  row: TRow;
  columns: ReadonlyArray<ColumnDef<TRow>>;
  onRowClick?: (row: TRow) => void;
}

/** True when the event started inside something that handles its own clicks. */
function fromInteractiveChild(event: MouseEvent<HTMLTableRowElement>): boolean {
  const target = event.target as HTMLElement | null;
  return Boolean(target?.closest('button, a, input, select, textarea, [role="menu"]'));
}

export function DataTableRow<TRow>({ row, columns, onRowClick }: DataTableRowProps<TRow>) {
  const clickable = Boolean(onRowClick);

  return (
    <tr
      className={pz('data-table', 'row')}
      onClick={(event) => {
        if (!onRowClick || fromInteractiveChild(event)) return;
        onRowClick(row);
      }}
      style={{
        borderBottom: `1px solid ${color.border}`,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      {columns.map((column, index) => {
        const content = column.cell(row);
        const isFirst = index === 0;

        return (
          <td
            key={column.id}
            style={{
              padding: `${space[3]} ${space[4]}`,
              textAlign: column.align === 'end' ? 'right' : 'left',
              fontSize: font.size.md,
              color: color.textPrimary,
              verticalAlign: 'middle',
            }}
          >
