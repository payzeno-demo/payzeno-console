/**
 * Table state.
 *
 * `ColumnDef<TRow>` itself is frozen in `components/data/column.types.ts`; this module carries
 * the *state* that sits around a table — paging, sorting, selection — and the mapping from
 * that state onto a contracts `ListQuery`.
 */
import type { ListQuery, Paginated } from '@payzeno/contracts';

import type { SortDirection } from '@lib/sort';

/** Cursor pagination state. The API is cursor-based; there is no page number. */
export interface PageState {
  limit: number;
  cursor: string | null;
  /** Cursors we have already visited, so "previous" works without a server round trip. */
  history: ReadonlyArray<string | null>;
}

export interface SelectionState {
  /** Row ids. Kept as a Set because settlement batches routinely hold thousands of items. */
  ids: ReadonlySet<string>;
  allOnPage: boolean;
}

export interface TableState {
  page: PageState;
  sort: SortState | null;
  selection: SelectionState;
}

export const EMPTY_SELECTION: SelectionState = { ids: new Set<string>(), allOnPage: false };

/** Step back. Returns the same state when there is nowhere to go. */
export function previousPage(state: PageState): PageState {
  if (state.history.length === 0) return state;
  const history = state.history.slice(0, -1);
  const cursor = state.history[state.history.length - 1] ?? null;
  return { limit: state.limit, cursor, history };
}

/** True when the current page is the first one. Disables the "previous" control. */
export function isFirstPage(state: PageState): boolean {
  return state.history.length === 0;
}

/**
 * A paginated response plus the flags the table renders around it. Every list hook returns
 * this shape so `<DataTable />` never has to care which resource it is showing.
 */
export interface TablePage<TRow> {
  rows: ReadonlyArray<TRow>;
  hasMore: boolean;
  nextCursor: string | null;
  isLoading: boolean;
  isFetching: boolean;
}

