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
