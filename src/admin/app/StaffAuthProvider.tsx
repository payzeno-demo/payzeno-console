/**
 * Staff session bootstrap — the admin twin of `app/AuthProvider.tsx`.
 *
 * Mounts `useStaffSession()` once and publishes it over `StaffSessionContext`. A 401 from the
 * bootstrap redirects to `/login` from here and only here; a page that sees a 401 of its own
 * calls `refresh()`, the bootstrap re-reads `GET /v1/staff/auth/me`, gets its 401, and this
 * provider does the redirect. No page navigates on 401 itself.
 */
import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ADMIN_ROUTES } from '../adminRoutes';
import { useStaffSession } from '../features/auth/useStaffSession';

import { StaffSessionContext } from './StaffSessionContext';
import type { StaffSessionContextValue } from './StaffSessionContext';

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { staff, isLoading, isSignedOut, error, refetch } = useStaffSession();

  useEffect(() => {
    if (!isSignedOut || pathname === ADMIN_ROUTES.login) return;
    navigate(ADMIN_ROUTES.login, { replace: true, state: { from: `${pathname}${search}` } });
  }, [isSignedOut, pathname, search, navigate]);

  const value = useMemo<StaffSessionContextValue>(
    () => ({ staff, isLoading, error, refresh: refetch }),
    [staff, isLoading, error, refetch],
  );

  return <StaffSessionContext.Provider value={value}>{children}</StaffSessionContext.Provider>;
}
