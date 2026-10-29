/**
 * `useStaffSession()` — `GET /v1/staff/auth/me`.
 *
 * Mounted once, by `StaffAuthProvider`. Two callers would mean two bootstrap queries racing on a
 * cold cache; everything else reads `StaffSessionContext`.
 */
import type { StaffUser } from '@payzeno/contracts';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { UnauthorizedError } from '@api/errors';

import { useAdminEndpoints } from '../../app/AdminApiContext';

import { staffSessionQuery } from './staff-auth.queries';

export interface UseStaffSessionResult {
  staff: StaffUser | null;
  isLoading: boolean;
  /** payzeno-api answered 401: render the login route, not an error. */
  isSignedOut: boolean;
  /** Any other failure — the api is down or unreachable. */
  error: Error | null;
  refetch: () => void;
}

export function useStaffSession(): UseStaffSessionResult {
  const endpoints = useAdminEndpoints();
  const query = useQuery(staffSessionQuery(endpoints));

  const isSignedOut = query.error instanceof UnauthorizedError;

  const { refetch: refetchQuery } = query;
  const refetch = useCallback(() => {
    void refetchQuery();
  }, [refetchQuery]);

  return {
    // A 401 on a refetch leaves the old data in the cache; it must not count as signed in, or
    // `/login` would bounce straight back to the page that just failed.
    staff: isSignedOut ? null : (query.data?.staff ?? null),
    isLoading: query.isLoading,
    isSignedOut,
    error: isSignedOut ? null : ((query.error as Error | null) ?? null),
    refetch,
  };
}
