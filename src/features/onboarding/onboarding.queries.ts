/**
 * Query and mutation factories for `features/onboarding` (RFC platform-v2 §3). The ONLY
 * caller of `OnboardingEndpoint`.
 */
import { queryOptions } from '@tanstack/react-query';

import type {
  KycDocument,
  Onboarding,
  UpdateOnboardingRequest,
  UploadKycDocumentRequest,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import { KYC_DOCUMENT_MAX_BYTES } from '@api/endpoints/onboarding.endpoint';
import { queryKeys } from '@api/queryKeys';

export { KYC_DOCUMENT_MAX_BYTES };

export function onboardingQuery(e: EndpointRegistry) {
  return queryOptions<Onboarding>({
    queryKey: queryKeys.onboarding.current(),
    queryFn: () => e.onboarding.get(),
    // A staff decision lands at any time; the Home checklist should notice within a minute.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function updateOnboardingMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['onboarding', 'update'] as const,
    mutationFn: (request: UpdateOnboardingRequest): Promise<Onboarding> =>
      e.onboarding.update(request),
  };
}

export function uploadKycDocumentMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['onboarding', 'upload-document'] as const,
    mutationFn: (request: UploadKycDocumentRequest): Promise<KycDocument> =>
      e.onboarding.uploadDocument(request),
  };
}

export function submitOnboardingMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['onboarding', 'submit'] as const,
    mutationFn: (): Promise<Onboarding> => e.onboarding.submit(),
  };
}
