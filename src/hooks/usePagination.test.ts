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

  it('honours an initial limit', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(undefined, 50));

    expect(result.current.query.limit).toBe(50);
  });

  it('cannot go forward until a response says there is more', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(false)));

    expect(result.current.canGoForward).toBe(false);
  });

  it('can go forward once a response carries a cursor', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(true)));

    expect(result.current.canGoForward).toBe(true);
  });

  it('cannot go forward when has_more is true but the cursor is missing', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(true, null)));

    expect(result.current.canGoForward).toBe(false);
  });
});

describe('going forward', () => {
  it('puts the cursor on the query and advances the page number', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(true)));

    act(() => {
      result.current.goNext();
    });

    expect(result.current.query.cursor).toBe('cur_2');
    expect(result.current.pageNumber).toBe(2);
    expect(result.current.canGoBack).toBe(true);
  });

  it('does nothing when there is no cursor to advance to', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(false)));

    act(() => {
      result.current.goNext();
    });

    expect(result.current.pageNumber).toBe(1);
    expect(result.current.query.cursor).toBeUndefined();
  });
});

describe('going back', () => {
  it('returns to the previous cursor', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(true)));

    act(() => {
      result.current.goNext();
    });
    act(() => {
      result.current.goBack();
    });

    expect(result.current.pageNumber).toBe(1);
    expect(result.current.query.cursor).toBeUndefined();
  });

  it('is a no-op on the first page', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(true)));

    act(() => {
      result.current.goBack();
    });

    expect(result.current.pageNumber).toBe(1);
  });
});

describe('changing the page size', () => {
  it('applies the new limit', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(true)));

    act(() => {
      result.current.setLimit(100);
    });

    expect(result.current.query.limit).toBe(100);
  });

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
  it('returns to the first page while keeping the page size', () => {
    const { result } = renderHookWithProviders(() => usePagination<Row>(page(true), 50));

    act(() => {
      result.current.goNext();
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.pageNumber).toBe(1);
    expect(result.current.query).toEqual({ limit: 50 });
  });
});
