/**
 * `useSession()` — `GET /v1/auth/me` (api-surface.md §12).
 *
 * `AuthProvider` bootstraps from this hook on mount. It is the first HTTP call the console
 * makes, and its response is the only source of `merchant`, `user` and `permissions` in the
 * whole app.
 */
import { useQuery } from '@tanstack/react-query';

import type { Merchant, SessionResponse, User } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import { UnauthorizedError } from '@api/errors';

import { sessionQuery } from './auth.queries';

export interface UseSessionResult {
  session: SessionResponse | undefined;
  user: User | undefined;
  merchant: Merchant | undefined;
  permissions: string[];
  isLoading: boolean;
  /** True when payzeno-api answered 401 — render the login route, not an error page. */
  isSignedOut: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSession(): UseSessionResult {
  const endpoints = useEndpoints();
  const query = useQuery(sessionQuery(endpoints));

  const isSignedOut = query.error instanceof UnauthorizedError;

  return {
    session: query.data,
    user: query.data?.user,
    merchant: query.data?.merchant,
    permissions: query.data?.permissions ?? [],
    isLoading: query.isLoading,
    isSignedOut,
    error: isSignedOut ? null : ((query.error as Error | null) ?? null),
    refetch: () => {
      void query.refetch();
    },
  };
}
