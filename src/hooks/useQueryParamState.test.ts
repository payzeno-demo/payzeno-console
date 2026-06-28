/**
 * `useQueryParamState` and its typed shorthands.
 *
 * Filters live in the URL so a merchant can send a colleague a link to exactly what they are
 * looking at. The consequence nobody expects is the cursor rule: changing any filter must drop
 * `cursor`, because page 3 of the old filter is meaningless under the new one — and the API
 * will happily answer with something that looks plausible and is wrong.
 */
import { act } from 'react';
import { describe, expect, it } from 'vitest';

import {
  useBooleanParam,
  useEnumParam,
  useNumberParam,
  useQueryParamState,
  useStringParam,
} from '@hooks/useQueryParamState';
import { renderHookWithProviders } from '@/test/render';

const STATUSES = ['open', 'closed', 'funded'] as const;

describe('useStringParam', () => {
  it('falls back when the parameter is absent', () => {
    const { result } = renderHookWithProviders(() => useStringParam('customer'), {
      route: '/payments',
    });

    expect(result.current[0]).toBe('');
  });

  it('reads the parameter from the URL', () => {
    const { result } = renderHookWithProviders(() => useStringParam('customer'), {
      route: '/payments?customer=cust-8814',
    });

    expect(result.current[0]).toBe('cust-8814');
  });

  it('writes the parameter back', () => {
    const { result } = renderHookWithProviders(() => useStringParam('customer'), {
      route: '/payments',
    });

    act(() => {
      result.current[1]('cust-99');
    });

    expect(result.current[0]).toBe('cust-99');
  });

  it('removes the parameter when set back to the fallback', () => {
    const { result } = renderHookWithProviders(() => useStringParam('customer'), {
      route: '/payments?customer=cust-8814',
    });

    act(() => {
      result.current[1]('');
    });

    expect(result.current[0]).toBe('');
  });
});

describe('the cursor rule', () => {
  it('drops the cursor when any filter changes', () => {
    const { result } = renderHookWithProviders(
      () => [useStringParam('customer'), useStringParam('cursor')] as const,
      { route: '/payments?customer=a&cursor=cur_page_three' },
    );

    expect(result.current[1][0]).toBe('cur_page_three');

    act(() => {
      result.current[0][1]('b');
    });

    expect(result.current[1][0]).toBe('');
  });
});

describe('useEnumParam', () => {
  it('accepts a value from the allowed set', () => {
    const { result } = renderHookWithProviders(() => useEnumParam('status', STATUSES), {
      route: '/settlements?status=funded',
    });

    expect(result.current[0]).toBe('funded');
  });

  it('rejects a value outside the set and falls back', () => {
    const { result } = renderHookWithProviders(
      () => useEnumParam('window', ['24h', '7d', '30d'] as const, '7d'),
      { route: '/' },
    );

    expect(result.current[0]).toBe('7d');
  });

  it('clears the parameter when set to null', () => {
    const { result } = renderHookWithProviders(() => useEnumParam('status', STATUSES), {
      route: '/settlements?status=funded',
    });

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBeNull();
  });
});

describe('useBooleanParam', () => {
  it('is false when absent', () => {
    const { result } = renderHookWithProviders(() => useBooleanParam('livemode'), {
      route: '/payments',
    });

    expect(result.current[0]).toBe(false);
  });

  it.each(['1', 'true'])('is true for %s', (raw) => {
    const { result } = renderHookWithProviders(() => useBooleanParam('livemode'), {
      route: `/payments?livemode=${raw}`,
    });

    expect(result.current[0]).toBe(true);
  });

  it('is false for anything else', () => {
    const { result } = renderHookWithProviders(() => useBooleanParam('livemode'), {
      route: '/payments?livemode=yes',
    });

    expect(result.current[0]).toBe(false);
  });

  it('removes the parameter when set false rather than writing livemode=0', () => {
    const { result } = renderHookWithProviders(() => useBooleanParam('livemode'), {
      route: '/payments?livemode=1',
    });

    act(() => {
      result.current[1](false);
    });

    expect(result.current[0]).toBe(false);
  });
});

describe('useNumberParam', () => {
  it('parses an integer', () => {
    const { result } = renderHookWithProviders(() => useNumberParam('limit', 25), {
      route: '/charges?limit=100',
    });

    expect(result.current[0]).toBe(100);
  });

  it('falls back for a non-numeric value', () => {
    const { result } = renderHookWithProviders(() => useNumberParam('limit', 25), {
      route: '/charges?limit=lots',
    });

    expect(result.current[0]).toBe(25);
  });

  it('falls back for a value below the minimum', () => {
    const { result } = renderHookWithProviders(
      () =>
        useQueryParamState<string[]>('tags', {
          parse: (raw) => raw.split(','),
          serialise: (value) => (value.length > 0 ? value.join(',') : null),
          fallback: [],
        }),
      { route: '/charges?tags=a,b,c' },
    );

    expect(result.current[0]).toEqual(['a', 'b', 'c']);

    act(() => {
      result.current[1](['x']);
    });

    expect(result.current[0]).toEqual(['x']);
  });

  it('falls back when parse returns null', () => {
    const { result } = renderHookWithProviders(
      () =>
        useQueryParamState<number>('n', {
          parse: () => null,
          serialise: String,
          fallback: 7,
        }),
      { route: '/charges?n=whatever' },
    );

    expect(result.current[0]).toBe(7);
  });
});
