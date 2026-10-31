/**
 * The admin app's provider stack, in the one order that works:
 *
 *   (router)                   StaffAuthProvider redirects on 401, so it needs a navigator.
 *     QueryProvider            the one cache (ADR 0001) — the same client factory and retry
 *                              policy as the merchant console.
 *       AdminTransportProvider ApiClient on this host's /v1, or the admin mock.
 *         ToastProvider        mutation hooks toast.
 *           TooltipProvider    the single Radix tooltip provider.
 *             StaffAuthProvider  GET /v1/staff/auth/me — needs endpoints and the cache.
 *
 * No FlagsProvider (no admin flags) and no NotificationProvider: staff are not on the merchant
 * notification socket. `AdminProviderStack` is the stack without a router, so tests can put a
 * `MemoryRouter` outside it and production a `BrowserRouter` — one definition of the order,
 * rather than the two `AppProviders` keeps in step by hand (PAY-2011).
 */
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import type { HttpTransport } from '@api/transport';
import { QueryProvider } from '@app/QueryProvider';
import { ToastProvider } from '@app/ToastProvider';
import { TooltipProvider } from '@components/ui/Tooltip';

import { AdminTransportProvider } from './AdminTransportProvider';
import { StaffAuthProvider } from './StaffAuthProvider';

export interface AdminProviderStackProps {
  children: ReactNode;
  /** Test seams. `admin/main.tsx` passes none. */
  transport?: HttpTransport;
  apiBaseUrl?: string;
  queryClient?: QueryClient;
}

export function AdminProviderStack({
  children,
  transport,
  apiBaseUrl,
  queryClient,
}: AdminProviderStackProps) {
  return (
    <QueryProvider client={queryClient}>
      <AdminTransportProvider transport={transport} apiBaseUrl={apiBaseUrl}>
        <ToastProvider>
          <TooltipProvider>
            <StaffAuthProvider>{children}</StaffAuthProvider>
          </TooltipProvider>
        </ToastProvider>
      </AdminTransportProvider>
    </QueryProvider>
  );
}

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AdminProviderStack>{children}</AdminProviderStack>
    </BrowserRouter>
  );
}
