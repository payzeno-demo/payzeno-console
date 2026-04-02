/**
 * URL-backed state.
 *
 * Filters live in the query string, not in component state and not in localStorage. A merchant
 * pasting "the disputes I'm looking at" into Slack has to land their colleague on the same
 * view — that requirement is why `hooks/useLocalStorage.ts` never got used.
 */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface QueryParamOptions<T> {
  /** Parse the raw string. Return `null` for "not present / not valid". */
  parse: (raw: string) => T | null;
  /** Serialise back. Return `null` to remove the parameter entirely. */
  serialise: (value: T) => string | null;
  /** Used when the parameter is absent or unparseable. */
  fallback: T;
  /** Replace rather than push, so filter fiddling does not fill the back button. */
  replace?: boolean;
}

/**
 * One typed query parameter, read and written through the router.
 *
 * @returns `[value, setValue]`, where setting to the fallback removes the parameter so the URL
 * stays clean.
 */
export function useQueryParamState<T>(
  key: string,
  options: QueryParamOptions<T>,
): [T, (next: T) => void] {
  const [params, setParams] = useSearchParams();
  const { parse, serialise, fallback, replace = true } = options;

  const raw = params.get(key);

  const value = useMemo(() => {
    if (raw === null) return fallback;
    const parsed = parse(raw);
    return parsed === null ? fallback : parsed;
  }, [raw, parse, fallback]);

  const setValue = useCallback(
    (next: T) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          const serialised = serialise(next);
          if (serialised === null || serialised === '') updated.delete(key);
          else updated.set(key, serialised);
          // Any filter change invalidates the cursor — page 3 of the old filter is meaningless.
          updated.delete('cursor');
          return updated;
        },
        { replace },
      );
    },
    [key, serialise, setParams, replace],
  );

  return [value, setValue];
}

/** String parameter. The common case: a status filter, a currency. */
export function useStringParam(key: string, fallback = ''): [string, (next: string) => void] {
  return useQueryParamState<string>(key, {
    parse: (raw) => raw,
    serialise: (value) => (value === fallback ? null : value),
    fallback,
  });
}

/** Parameter constrained to a known set — every contracts enum filter uses this. */
