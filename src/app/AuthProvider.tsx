/**
 * Session bootstrap.
 *
 * Mounts `useSession()` — the `GET /v1/auth/me` call, which is the first request the console
 * makes — and publishes the result over `SessionContext`. Everything downstream reads the
 * context; nothing else calls `useSession()`, because two callers would mean two bootstrap
 * queries racing on a cold cache.
 *
 * 401 handling lives here and only here: `useSession()` reports `isSignedOut`, and this
 * provider redirects to `/login`. Individual features never handle 401 — they would each do it
 * slightly differently and one of them would do it during a render.
 *
 * The livemode toggle also lives here, because it is session state (not config, not a flag)
 * and it has to survive a route change without a refetch.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ACCOUNT_FLOW_PATHS, ROUTES } from '@/routes';
import { toConsoleSession, withLivemode } from '@/types/session';
import type { ConsoleSession } from '@/types/session';

import { useSession } from '@features/auth/useSession';
import { identifySession } from '@lib/telemetry';

import { SessionContext } from './SessionContext';
import type { SessionContextValue } from './SessionContext';

export interface AuthProviderProps {
  children: ReactNode;
  /** Injected by tests and by Storybook, which do not want a network call. */
  initialSession?: ConsoleSession;
}

/** Routes reachable without a session. Anything else redirects. */
export const PUBLIC_PATHS: ReadonlyArray<string> = [
  ROUTES.auth.login,
  // RFC platform-v2 §3-§4: signup and the emailed-link pages. A 401 from the bootstrap call
  // is the normal state on all of them and must not bounce the visitor to /login.
  ...ACCOUNT_FLOW_PATHS,
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { session: response, isLoading, isSignedOut, refetch } = useSession();

  const [livemodeOverride, setLivemodeOverride] = useState<boolean | null>(null);

  const session = useMemo<ConsoleSession | null>(() => {
    if (initialSession) {
      return livemodeOverride === null ? initialSession : withLivemode(initialSession, livemodeOverride);
    }
    if (!response) return null;
    return toConsoleSession(response, livemodeOverride ?? undefined);
  }, [initialSession, response, livemodeOverride]);

  // A 401 anywhere in the app surfaces here, because every query funnels through the same
  // client and the session query is the one that notices first.
  useEffect(() => {
    if (!isSignedOut || isPublicPath(pathname)) return;
    navigate(ROUTES.auth.login, { replace: true, state: { from: pathname } });
  }, [isSignedOut, pathname, navigate]);

  // Tag the telemetry scope so a Sentry issue says which merchant and which role hit it.
  // Id, merchant and role only — never the email (dhotfix, PAY-1811).
  useEffect(() => {
    if (!session) return;
    identifySession(session.user.id, session.merchant.id, session.user.role);
  }, [session]);

  const setLivemode = useCallback((livemode: boolean) => {
    setLivemodeOverride(livemode);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ session, isLoading, setLivemode, refresh: refetch }),
    [session, isLoading, setLivemode, refetch],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
