/**
 * Mutation factories for `features/signup` (RFC platform-v2 §3). The ONLY caller of
 * `SignupEndpoint`.
 */
import type {
  LoginResponse,
  SignupRequest,
  SignupResponse,
  VerifyEmailRequest,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';

export function signupMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['signup', 'create'] as const,
    mutationFn: (request: SignupRequest): Promise<SignupResponse> => e.signup.create(request),
  };
}

export function verifyEmailMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['signup', 'verify'] as const,
    mutationFn: (request: VerifyEmailRequest): Promise<LoginResponse> => e.signup.verify(request),
  };
}
