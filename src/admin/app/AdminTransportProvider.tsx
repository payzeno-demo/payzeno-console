/**
 * Picks the admin app's transport and builds its endpoint registry — once.
 *
 * Same seam as `app/TransportProvider.tsx`: `ApiClient` normally, a mock under `?mock=1`
 * (`shouldUseMock()` is shared, so one URL flag means the same thing on both hosts). The one
 * difference is the base URL: `ApiClient` is pointed at *this* host's `/v1` (see
 * `api/base-url.ts`), because the admin host is not the host the bundle was built for.
 */
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { ApiClient } from '@api/client';
import type { HttpTransport } from '@api/transport';
import { shouldUseMock } from '@app/TransportProvider';

import { adminApiBaseUrl } from '../api/base-url';
import { createAdminEndpoints } from '../api/endpoints';
import { AdminMockTransport } from '../api/mock/admin-mock-transport';

import { AdminApiContext } from './AdminApiContext';
import type { AdminApiContextValue } from './AdminApiContext';

export interface AdminTransportProviderProps {
  children: ReactNode;
  /** Injected by tests. When set, neither `ApiClient` nor `AdminMockTransport` is built. */
  transport?: HttpTransport;
  /** Injected by tests, which run on jsdom's origin but answer on the MSW base. */
  apiBaseUrl?: string;
}

export function AdminTransportProvider({
  children,
  transport,
  apiBaseUrl,
}: AdminTransportProviderProps) {
  const baseUrl = useMemo(() => apiBaseUrl ?? adminApiBaseUrl(), [apiBaseUrl]);

  const value = useMemo<AdminApiContextValue>(() => {
    const client: HttpTransport =
      transport ?? (shouldUseMock() ? new AdminMockTransport() : new ApiClient({ baseUrl }));
    return {
      endpoints: createAdminEndpoints(client, { apiBaseUrl: baseUrl }),
      isMock: client instanceof AdminMockTransport,
    };
  }, [transport, baseUrl]);

  return <AdminApiContext.Provider value={value}>{children}</AdminApiContext.Provider>;
}
