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
