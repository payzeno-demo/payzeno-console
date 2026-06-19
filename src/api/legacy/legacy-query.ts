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
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  // Serialised so the effect does not re-run on every render for an object literal.
  const querySignature = JSON.stringify(options.query ?? {});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    fetchJson<T>(path, {
      query: JSON.parse(querySignature) as Record<string, string | number | undefined>,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [path, querySignature, enabled, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, isLoading, error, refetch };
}
