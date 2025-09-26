/**
 * Loading rows.
 *
 * Rendered inside `<tbody>` while a list query is pending. The bars vary in width across cells
 * and across rows: a grid of identical grey rectangles reads as a rendering bug, not as
 * loading. The widths come from a fixed pattern rather than `Math.random()` so that snapshot
 * tests are stable and so two renders of the same table do not jitter.
 *
 * a11y (tflexbox): the skeleton is `aria-hidden`. `<DataTable>` already sets `aria-busy` on the
 * table, and announcing eight rows of nothing is worse than announcing nothing at all.
 */
import { pz } from '@lib/cn';

import { Skeleton } from '../ui/Skeleton';
import { color, space } from '../ui/tokens';

export interface RowSkeletonProps {
  columnCount: number;
  rowCount: number;
}

/** Repeating width pattern. Prime-ish length so it does not line up into visual columns. */
const WIDTH_PATTERN: ReadonlyArray<string> = ['70%', '45%', '90%', '55%', '80%', '35%', '65%'];

export function widthFor(rowIndex: number, columnIndex: number): string {
  const offset = (rowIndex * 3 + columnIndex) % WIDTH_PATTERN.length;
  return WIDTH_PATTERN[offset] ?? '60%';
}

export function RowSkeleton({ columnCount, rowCount }: RowSkeletonProps) {
  const rows = Array.from({ length: Math.max(0, rowCount) }, (_, index) => index);
  const columns = Array.from({ length: Math.max(1, columnCount) }, (_, index) => index);

  return (
    <>
      {rows.map((rowIndex) => (
        <tr
          key={`skeleton-${rowIndex}`}
          aria-hidden="true"
          className={pz('data-table', 'skeleton-row')}
          style={{ borderBottom: `1px solid ${color.border}` }}
        >
          {columns.map((columnIndex) => (
            <td
              key={`skeleton-${rowIndex}-${columnIndex}`}
              style={{ padding: `${space[3]} ${space[4]}` }}
            >
