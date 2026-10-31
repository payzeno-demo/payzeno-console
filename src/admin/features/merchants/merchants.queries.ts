/**
 * Query and mutation factories for admin merchants. The only caller of `AdminMerchantsEndpoint`.
 */
import type {
  AdminMerchantDetail,
  AdminMerchantListQuery,
  AdminMerchantSummary,
  Paginated,
} from '@payzeno/contracts';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import type { AdminEndpointRegistry } from '../../api/endpoints';
import type { OnboardingDecision } from '../../api/endpoints/admin-merchants.endpoint';

export function adminMerchantsQuery(e: AdminEndpointRegistry, q: AdminMerchantListQuery = {}) {
  return queryOptions<Paginated<AdminMerchantSummary>>({
    queryKey: adminQueryKeys.merchants.list(q),
    queryFn: () => e.merchants.list(q),
    // Typing in the search box must not blank the table between keystrokes.
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function adminMerchantQuery(e: AdminEndpointRegistry, merchantId: string) {
  return queryOptions<AdminMerchantDetail>({
    queryKey: adminQueryKeys.merchants.detail(merchantId),
    queryFn: () => e.merchants.get(merchantId),
    staleTime: 15_000,
  });
}

export interface MerchantDecisionInput {
  merchantId: string;
  decision: OnboardingDecision;
  /** Required for `reject` and `request-info`; shown to the merchant verbatim. */
  message?: string;
}

/** `POST /v1/admin/merchants/:id/onboarding/{approve|reject|request-info}`. */
export function merchantDecisionMutation(e: AdminEndpointRegistry) {
  return {
    mutationKey: ['admin', 'merchants', 'decision'] as const,
    mutationFn: ({ merchantId, decision, message }: MerchantDecisionInput) =>
      e.merchants.decide(merchantId, decision, message ? { message } : {}),
  };
}

export type MerchantStatusTarget = 'active' | 'restricted' | 'suspended';

export interface MerchantStatusInput {
  merchantId: string;
  status: MerchantStatusTarget;
  reason: string;
}

/** `POST /v1/admin/merchants/:id/status`. */
export function merchantStatusMutation(e: AdminEndpointRegistry) {
  return {
    mutationKey: ['admin', 'merchants', 'status'] as const,
    mutationFn: ({ merchantId, status, reason }: MerchantStatusInput) =>
      e.merchants.setStatus(merchantId, { status, reason }),
  };
}
