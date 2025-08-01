/**
 * Route guard: there must be a session.
 *
 * Used as the element of the authenticated branch of `router.tsx`, wrapping an `<Outlet/>`.
 * It handles the three states the bootstrap call can be in, and the distinction between the
 * middle two is the whole point:
 *
 *   loading      — `GET /v1/auth/me` is in flight. Render a loading page, redirect to nothing.
 *   no session   — the call came back 401. `AuthProvider` is already redirecting; render null
 *                  so we do not flash a login link on top of the navigation.
 *   session      — render the children.
 *
 * The first version of this file redirected while `isLoading` was true, which meant every cold
 * load bounced through `/login` and back, and the login form flashed for ~200ms on every hard
 * refresh (PAY-1760).
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import { ROUTES } from '@/routes';

import { LoadingPage } from '@components/feedback/LoadingPage';

import { useSessionState } from './SessionContext';

export interface RequireSessionProps {
  /** Omit to render an `<Outlet/>`, which is how `router.tsx` uses it. */
  children?: ReactNode;
  /** What to show while the bootstrap call is in flight. */
  fallback?: ReactNode;
}

export function RequireSession({ children, fallback }: RequireSessionProps) {
  const { session, isLoading } = useSessionState();
  const location = useLocation();

  if (isLoading) {
    return <>{fallback ?? <LoadingPage label="Loading your account" variant="spinner" />}</>;
  }

  if (!session) {
    // `AuthProvider` also redirects on 401; this covers a direct hit on a deep link with no
    // cookie at all, where no request has failed yet. `state.from` is what sends the user back
    // where they were aiming after they sign in.
    return <Navigate to={ROUTES.auth.login} replace state={{ from: location.pathname }} />;
  }

  return <>{children ?? <Outlet />}</>;
}

/**
 * The inverse: a route that only makes sense when signed **out**. `/login` uses it, so that
 * hitting it with a live session lands on the dashboard instead of asking for a password.
 */
export function RequireNoSession({ children }: { children?: ReactNode }) {
  const { session, isLoading } = useSessionState();
  const location = useLocation();

  if (isLoading) return null;

  if (session) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? ROUTES.reporting.index} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
