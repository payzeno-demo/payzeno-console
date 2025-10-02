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
