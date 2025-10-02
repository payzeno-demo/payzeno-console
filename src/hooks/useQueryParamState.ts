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
