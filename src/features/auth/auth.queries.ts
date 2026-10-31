/**
 * Query and mutation factories for `features/auth`.
 *
 * Every factory takes the `EndpointRegistry` as an argument rather than importing a client,
 * which is what lets `TransportProvider` hand the whole app `MockTransport` under `?mock=1`
 * with no per-feature branching.
 */
import { queryOptions } from '@tanstack/react-query';

import type {
  AcceptInvitationRequest,
  LoginRequest,
  LoginResponse,
  PasswordResetConfirmRequest,
  SessionResponse,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import { UnauthorizedError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';

/** `GET /v1/auth/me`. The console bootstrap call; also refreshes the `pz_csrf` cookie. */
export function sessionQuery(e: EndpointRegistry) {
  return queryOptions<SessionResponse>({
    queryKey: queryKeys.session.me(),
    queryFn: () => e.auth.me(),
    // A 401 here is "not signed in", a normal state, not a failure to retry.
    retry: (_count, error) => !(error instanceof UnauthorizedError),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export interface LoginMutationInput {
  request: LoginRequest;
}

export function loginMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['auth', 'login'] as const,
    mutationFn: ({ request }: LoginMutationInput): Promise<LoginResponse> =>
      e.auth.login(request),
  };
}

export function logoutMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['auth', 'logout'] as const,
    mutationFn: (): Promise<void> => e.auth.logout(),
  };
}

export function passwordResetMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['auth', 'password-reset'] as const,
    mutationFn: (email: string): Promise<void> => e.auth.requestPasswordReset(email),
  };
}

/** RFC platform-v2 §4: spends a `team_invite` token and signs the new member in. */
export function acceptInvitationMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['auth', 'accept-invitation'] as const,
    mutationFn: (request: AcceptInvitationRequest): Promise<LoginResponse> =>
      e.auth.acceptInvitation(request),
  };
}

/** RFC platform-v2 §4: spends a `password_reset` token. Does not sign in. */
export function confirmPasswordResetMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['auth', 'password-reset-confirm'] as const,
    mutationFn: (request: PasswordResetConfirmRequest): Promise<void> =>
      e.auth.confirmPasswordReset(request),
  };
}
