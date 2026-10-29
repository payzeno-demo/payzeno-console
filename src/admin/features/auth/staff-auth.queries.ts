/**
 * Query and mutation factories for the staff session. The only caller of `StaffAuthEndpoint`.
 */
import type { StaffLoginRequest, StaffSessionResponse } from '@payzeno/contracts';
import { queryOptions } from '@tanstack/react-query';

import { UnauthorizedError } from '@api/errors';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import type { AdminEndpointRegistry } from '../../api/endpoints';

/** `GET /v1/staff/auth/me` — the admin bootstrap call; also refreshes `pz_csrf`. */
export function staffSessionQuery(e: AdminEndpointRegistry) {
  return queryOptions<StaffSessionResponse>({
    queryKey: adminQueryKeys.staffSession.me(),
    queryFn: () => e.staffAuth.me(),
    // 401 is "not signed in", a normal state. Anything else gets the default policy.
    retry: (count, error) => !(error instanceof UnauthorizedError) && count < 2,
    // The bootstrap renders its own "cannot reach Payzeno" state instead of the boundary.
    throwOnError: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function staffLoginMutation(e: AdminEndpointRegistry) {
  return {
    mutationKey: ['admin', 'staff-auth', 'login'] as const,
    mutationFn: (request: StaffLoginRequest): Promise<StaffSessionResponse> =>
      e.staffAuth.login(request),
  };
}

export function staffLogoutMutation(e: AdminEndpointRegistry) {
  return {
    mutationKey: ['admin', 'staff-auth', 'logout'] as const,
    mutationFn: (): Promise<void> => e.staffAuth.logout(),
  };
}
