// FIXME(rrefactor): this predates TanStack Query and violates
// docs/adr/0001-tanstack-query-as-the-only-cache.md and
// docs/adr/0004-endpoint-classes-over-fetch-helpers.md at the same time. Data fetched
// through here is invisible to `queryClient.invalidateQueries`, which is why creating an
// invoice-adjacent thing never refreshes the invoices table. PAY-1902.
/**
 * LEGACY. A pre-TanStack `useEffect` fetch hook with its own loading state.
 *
 * The only caller is `features/invoices`. It is kept alive by the same inertia that keeps
 * `fetch-json.ts` alive: migrating invoices means touching the legacy biller's response
 * shape, which is arc MIG's problem, which is not the Web team's problem.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchJson } from './fetch-json';

export interface LegacyQueryState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface LegacyQueryOptions {
  query?: Record<string, string | number | undefined>;
  enabled?: boolean;
}

export function useLegacyQuery<T>(path: string, options: LegacyQueryOptions = {}): LegacyQueryState<T> {
  const { enabled = true } = options;
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, isLoading, error, refetch };
}
