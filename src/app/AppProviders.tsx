/**
 * The provider stack, in the one order that works.
 *
 * The order is not cosmetic and each step depends on the one outside it:
 *
 *   BrowserRouter        AuthProvider redirects on 401, so it needs a navigator.
 *     FlagsProvider      build-time values; nothing depends on it, but features read it.
 *       QueryProvider    owns the cache every hook below uses.
 *         TransportProvider  builds the endpoint registry (ApiClient or MockTransport).
 *           ToastProvider     mutation hooks call useToast(); AuthProvider does not.
 *             TooltipProvider  the single Radix tooltip provider (components/ui/Tooltip.tsx).
 *             AuthProvider    runs GET /v1/auth/me — needs endpoints AND the query client.
 *               NotificationProvider  opens the socket only once there is a session.
 *
 * Getting this wrong fails loudly: `useEndpoints()` throws outside `TransportProvider`, and
 * `AuthProvider` calling `useSession()` above `QueryProvider` throws from TanStack. That is
 * deliberate — a provider stack that silently half-works is worse than one that crashes on
 * boot.
 *
 * The router lives here rather than in `App.tsx` because `AuthProvider` must be *inside* it.
 */
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

import type { HttpTransport } from '@api/transport';
import type { FlagName } from '@lib/flags';
import type { ConsoleSession } from '@/types/session';

import { AuthProvider } from './AuthProvider';
import { FlagsProvider } from './FlagsProvider';
import { NotificationProvider } from './NotificationProvider';
import { QueryProvider } from './QueryProvider';
import { ToastProvider } from './ToastProvider';
import { TooltipProvider } from '@components/ui/Tooltip';
import { TransportProvider } from './TransportProvider';

export interface AppProvidersProps {
  children: ReactNode;
  /** Test seams. `main.tsx` passes none of these. */
  transport?: HttpTransport;
  initialSession?: ConsoleSession;
  flagOverrides?: Partial<Record<FlagName, boolean>>;
}

export function AppProviders({
  children,
  transport,
  initialSession,
  flagOverrides,
}: AppProvidersProps) {
  return (
    <BrowserRouter>
      <FlagsProvider overrides={flagOverrides}>
        <QueryProvider>
          <TransportProvider transport={transport}>
            <ToastProvider>
              <TooltipProvider>
                <AuthProvider initialSession={initialSession}>
                  <NotificationProvider>{children}</NotificationProvider>
                </AuthProvider>
              </TooltipProvider>
            </ToastProvider>
          </TransportProvider>
        </QueryProvider>
      </FlagsProvider>
    </BrowserRouter>
  );
}

/**
 * The same stack without the router, for `src/test/render.tsx`, which supplies a
 * `MemoryRouter` so a test can start on an arbitrary path.
 *
 * Keeping these two in sync by hand is a known wart; the alternative was a `router` prop on
 * `AppProviders`, which made `main.tsx` read like a test harness.
 * TODO(rrefactor): one component, a `router` render prop — PAY-2011.
 */
export function AppProvidersWithoutRouter({
  children,
  transport,
  initialSession,
  flagOverrides,
}: AppProvidersProps) {
  return (
    <FlagsProvider overrides={flagOverrides}>
      <QueryProvider>
        <TransportProvider transport={transport}>
          <ToastProvider>
            <TooltipProvider>
              <AuthProvider initialSession={initialSession}>
                <NotificationProvider>{children}</NotificationProvider>
              </AuthProvider>
            </TooltipProvider>
          </ToastProvider>
        </TransportProvider>
      </QueryProvider>
    </FlagsProvider>
  );
}
