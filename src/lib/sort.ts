/**
 * Comparators.
 *
 * Server-side ordering is the default for every list route; this module exists for the cases
 * where the whole page is already in memory — settlement item tables, balance buckets, the
 * team list — and re-fetching to change a sort is silly.
 */

export type SortDirection = 'asc' | 'desc';

function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0;
  // Nulls last, regardless of direction — an empty cell floating to the top of a
  // descending sort reads as a data bug.
  if (a === null) return 1;
  if (b === null) return -1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'en', { numeric: true, sensitivity: 'base' });
}

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

