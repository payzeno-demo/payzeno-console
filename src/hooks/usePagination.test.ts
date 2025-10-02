/**
 * `usePagination` — cursor pagination, with a history stack so Previous can work at all.
 *
 * Opaque cursors have no inverse: you cannot compute the previous page from the current one.
 * The stack is what makes Previous possible, and changing the page size has to throw it away,
 * because every cursor in it encodes the old size.
 */
import { act } from 'react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { usePagination } from '@hooks/usePagination';
import { renderHookWithProviders } from '@/test/render';

interface Row {
  id: string;
}

function page(hasMore: boolean, cursor: string | null = hasMore ? 'cur_2' : null) {
  return { data: [{ id: 'r1' }] as Row[], next_cursor: cursor, has_more: hasMore };
}

describe('the initial state', () => {
  it('starts on page one with the default limit and no cursor', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(undefined));

    expect(result.current.pageNumber).toBe(1);
    expect(result.current.query).toEqual({ limit: DEFAULT_PAGE_SIZE });
    expect(result.current.canGoBack).toBe(false);
  });

  it('cannot go forward until a response says there is more', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(false)));

    expect(result.current.canGoForward).toBe(false);
  });

  it('cannot go forward when has_more is true but the cursor is missing', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(true, null)));

    expect(result.current.canGoForward).toBe(false);
  });
});

describe('going forward', () => {
  it('throws the cursor history away — old cursors encode the old size', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(true)));

    act(() => {
      result.current.goNext();
    });
    expect(result.current.pageNumber).toBe(2);

    act(() => {
      result.current.setLimit(100);
    });

    expect(result.current.pageNumber).toBe(1);
    expect(result.current.query.cursor).toBeUndefined();
    expect(result.current.canGoBack).toBe(false);
  });
});

describe('reset', () => {
});
