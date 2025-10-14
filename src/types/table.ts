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

export interface SortState {
  columnId: string;
  direction: SortDirection;
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

export function initialTableState(limit: number): TableState {
  return {
    page: { limit, cursor: null, history: [] },
    sort: null,
    selection: EMPTY_SELECTION,
  };
}

/**
 * Project table state onto the list query the endpoint takes.
 *
 * `ListQuery` is the frozen contract shape — this is where console-local state stops and the
 * wire format starts.
 */
export function toListQuery(state: TableState): ListQuery {
  const query: ListQuery = { limit: state.page.limit };
  if (state.page.cursor) query.cursor = state.page.cursor;
  return query;
}

/** Advance to the next page, remembering where we were. */
export function nextPage(state: PageState, nextCursor: string | null): PageState {
  return {
    limit: state.limit,
    cursor: nextCursor,
    history: [...state.history, state.cursor],
  };
}

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

/** Adapt a contracts `Paginated<T>` into a `TablePage`, applying a row mapper. */
export function toTablePage<TResource, TRow>(
  response: Paginated<TResource> | undefined,
  mapRow: (resource: TResource) => TRow,
  flags: { isLoading: boolean; isFetching: boolean },
): TablePage<TRow> {
  return {
    rows: response ? response.data.map(mapRow) : [],
    hasMore: response?.has_more ?? false,
    nextCursor: response?.next_cursor ?? null,
    isLoading: flags.isLoading,
    isFetching: flags.isFetching,
  };
}

/** Toggle one row id in a selection. */
export function toggleSelected(selection: SelectionState, id: string): SelectionState {
  const ids = new Set(selection.ids);
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  return { ids, allOnPage: false };
}
