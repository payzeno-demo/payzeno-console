/**
 * Cursor pagination state for a list view.
 *
 * The API is cursor-based (`Paginated<T>.next_cursor`), so there is no page number and no
 * total. "Previous" works because we remember the cursors we have already used — see
 * `types/table.ts::previousPage`.
 */
import { useCallback, useMemo, useState } from 'react';

import type { ListQuery, Paginated } from '@payzeno/contracts';

import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { isFirstPage, nextPage, previousPage } from '@/types/table';
import type { PageState } from '@/types/table';

export interface Pagination {
  state: PageState;
  /** The slice of `ListQuery` this state contributes. Spread into the feature's query. */
  query: Pick<ListQuery, 'limit' | 'cursor'>;
  canGoBack: boolean;
  canGoForward: boolean;
  /** Page index, 1-based. Display only — the API has no concept of it. */
  pageNumber: number;
  goNext: () => void;
  goBack: () => void;
  setLimit: (limit: number) => void;
  /** Back to page one. Called whenever a filter changes. */
  reset: () => void;
}

/**
 * @param response the current page, so the hook knows whether a next cursor exists. Pass
 * `undefined` while the query is pending — the forward control disables itself.
 */
export function usePagination<T>(
  response: Paginated<T> | undefined,
  initialLimit: number = DEFAULT_PAGE_SIZE,
): Pagination {
  const [state, setState] = useState<PageState>({
    limit: initialLimit,
    cursor: null,
    history: [],
  });

  const goNext = useCallback(() => {
    const cursor = response?.next_cursor ?? null;
    if (!cursor) return;
    setState((current) => nextPage(current, cursor));
  }, [response?.next_cursor]);

  const goBack = useCallback(() => {
    setState((current) => previousPage(current));
  }, []);

  const setLimit = useCallback((limit: number) => {
    // Changing the page size invalidates every cursor we hold — they encode the old size.
    setState({ limit, cursor: null, history: [] });
  }, []);

  const reset = useCallback(() => {
    setState((current) => ({ limit: current.limit, cursor: null, history: [] }));
  }, []);

  const query = useMemo(() => {
    const value: Pick<ListQuery, 'limit' | 'cursor'> = { limit: state.limit };
    if (state.cursor) value.cursor = state.cursor;
    return value;
  }, [state.limit, state.cursor]);

  return {
    state,
    query,
    canGoBack: !isFirstPage(state),
