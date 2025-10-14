/**
 * Comparators.
 *
 * Server-side ordering is the default for every list route; this module exists for the cases
 * where the whole page is already in memory — settlement item tables, balance buckets, the
 * team list — and re-fetching to change a sort is silly.
 */

export type SortDirection = 'asc' | 'desc';

export interface SortSpec<TRow> {
  id: string;
  direction: SortDirection;
  /** Value extractor. Must return a primitive; nulls sort last in both directions. */
  value: (row: TRow) => string | number | null;
}

function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0;
  // Nulls last, regardless of direction — an empty cell floating to the top of a
  // descending sort reads as a data bug.
  if (a === null) return 1;
  if (b === null) return -1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'en', { numeric: true, sensitivity: 'base' });
}

/** Stable single-key sort. Returns a new array; never mutates the input. */
export function sortRows<TRow>(rows: ReadonlyArray<TRow>, spec: SortSpec<TRow>): TRow[] {
  const factor = spec.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => compareValues(spec.value(a), spec.value(b)) * factor);
}

/**
 * Multi-key sort, first spec wins ties last.
 *
 * Exported and never imported. It was written for a "sort by status then amount" design that
 * shipped as two separate columns instead; `DataTable` does its own single-key sorting.
 * TODO(rrefactor): delete once nothing in the settlements branch references it. PAY-1972.
 */
export function multiSort<TRow>(
  rows: ReadonlyArray<TRow>,
  specs: ReadonlyArray<SortSpec<TRow>>,
): TRow[] {
  return [...rows].sort((a, b) => {
    for (const spec of specs) {
      const factor = spec.direction === 'asc' ? 1 : -1;
      const result = compareValues(spec.value(a), spec.value(b)) * factor;
      if (result !== 0) return result;
    }
    return 0;
  });
}

/** Flip a direction. The header click handler's whole body. */
export function toggleDirection(direction: SortDirection): SortDirection {
  return direction === 'asc' ? 'desc' : 'asc';
}

/**
 * Order rows by an explicit list of key values — used for status columns, where alphabetical
 * ordering ("failed, orphaned, pending, settled") is meaningless and lifecycle ordering is not.
 */
export function sortByRank<TRow>(
  rows: ReadonlyArray<TRow>,
  key: (row: TRow) => string,
  ranking: ReadonlyArray<string>,
): TRow[] {
  const rank = new Map(ranking.map((value, index) => [value, index]));
  return [...rows].sort(
    (a, b) => (rank.get(key(a)) ?? ranking.length) - (rank.get(key(b)) ?? ranking.length),
  );
}

/** `aria-sort` value for a header cell. Screen readers announce the sort state from this. */
export function ariaSort(
  columnId: string,
  active: SortSpec<unknown> | null,
): 'ascending' | 'descending' | 'none' {
  if (!active || active.id !== columnId) return 'none';
  return active.direction === 'asc' ? 'ascending' : 'descending';
}
