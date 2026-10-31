/**
 * The application root, below the providers.
 *
 * Responsibilities, and nothing else:
 *  1. draw the chrome (`<AppShell/>`),
 *  2. render the route table (`<AppRoutes/>`),
 *  3. catch anything a route throws that its own boundary did not (`<QueryErrorBoundary/>`).
 *
 * The shell is *outside* the routes rather than being a layout route, because a layout route
 * would remount the nav on every navigation and lose the side-nav scroll position on long
 * accounts. It draws nothing until the bootstrap call resolves — `AppShell` renders its
 * children bare when there is no user — so `/login` gets no chrome for free.
 */
import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { useSessionState } from '@app/SessionContext';
import { AppShell } from '@components/layout/AppShell';
import { QueryErrorBoundary } from '@components/feedback/ErrorBoundary';
import { useLogout } from '@features/auth/useLogout';
import { ActivationBanner } from '@features/onboarding/components/ActivationBanner';

import { AppRoutes } from '@/router';
import { isAccountFlowPath } from '@/routes';

export function App() {
  const { setLivemode, refresh } = useSessionState();
  const { logout } = useLogout();
  const { pathname } = useLocation();
  // Signup and the emailed-link pages render without chrome, signed in or not (RFC
  // platform-v2 §4): an invite link opened in a tab where the inviter is signed in must not
  // look like the inviter's dashboard.
  const accountFlow = isAccountFlowPath(pathname);

  /**
   * Flipping livemode changes what every list query returns, so the session is refreshed as
   * well as the flag flipped: `usePermissions()` differs between modes for `developer` users,
   * and the query keys include the mode (`api/queryKeys.ts`), which invalidates the cache for
   * us without an explicit `queryClient.clear()`.
   */
  const handleLivemodeChange = useCallback(
    (next: boolean) => {
      setLivemode(next);
      refresh();
    },
    [setLivemode, refresh],
  );

  /**
   * Merchant switching is a staff-session capability (`AuthPrincipal.acting_merchant_id`); a
   * merchant user only ever sees one. The console does not own the switch — it re-reads
   * `GET /v1/auth/me`, and the API decides whether the caller may act as that merchant.
   */
  const handleSwitchMerchant = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <QueryErrorBoundary feature="app">
      <AppShell
        onSignOut={logout}
        onLivemodeChange={handleLivemodeChange}
        onSwitchMerchant={handleSwitchMerchant}
        bare={accountFlow}
      >
        {/* RFC platform-v2 §3: "test mode only" until the business is verified. */}
        {accountFlow ? null : <ActivationBanner />}
        <AppRoutes />
      </AppShell>
    </QueryErrorBoundary>
  );
}

export default App;
