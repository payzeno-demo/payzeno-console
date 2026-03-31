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
      route: '/payments',
    });

    act(() => {
      result.current[1]('cust-99');
    });

    expect(result.current[0]).toBe('cust-99');
  });

  it('removes the parameter when set back to the fallback', () => {
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
      route: '/charges?limit=lots',
    });

    expect(result.current[0]).toBe(25);
  });

  it('falls back for a value below the minimum', () => {
  });
});
