/**
 * The admin endpoint registry, over context — the admin twin of `app/ApiContext.ts`.
 *
 * `AdminTransportProvider` builds the registry once; every `admin/features/<f>/<f>.queries.ts`
 * receives it as an argument. No admin feature imports `ApiClient` or branches on mock mode.
 */
import { createContext, useContext } from 'react';

import { assertProvider } from '@lib/assert';

import type { AdminEndpointRegistry } from '../api/endpoints';

export interface AdminApiContextValue {
  endpoints: AdminEndpointRegistry;
  /** `?mock=1`. Only the documents table reads it, to say why a link will not open. */
  isMock: boolean;
}

export const AdminApiContext = createContext<AdminApiContextValue | null>(null);

AdminApiContext.displayName = 'AdminApiContext';

/**
 * @throws {InvariantViolation} outside `<AdminTransportProvider>`.
 */
export function useAdminEndpoints(): AdminEndpointRegistry {
  return assertProvider(useContext(AdminApiContext), 'AdminTransportProvider').endpoints;
}

export function useAdminTransportIsMock(): boolean {
  return useContext(AdminApiContext)?.isMock ?? false;
}
