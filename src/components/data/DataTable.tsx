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
