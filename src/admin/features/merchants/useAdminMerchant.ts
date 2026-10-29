/**
 * `useAdminMerchant(id)` — `GET /v1/admin/merchants/:id`: the merchant, its onboarding
 * application (profile, representative, KYC documents) and its users, plus bank accounts and
 * balances when the api includes them.
 */
import type { AdminMerchantDetail } from '@payzeno/contracts';
import { useQuery } from '@tanstack/react-query';

import { useAdminEndpoints } from '../../app/AdminApiContext';

import { adminMerchantQuery } from './merchants.queries';

export interface UseAdminMerchantResult {
  detail: AdminMerchantDetail | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
  /** Absolute URL that opens a KYC document's bytes (same origin; the staff cookie rides along). */
  documentUrl: (documentId: string) => string;
}

export function useAdminMerchant(merchantId: string): UseAdminMerchantResult {
  const endpoints = useAdminEndpoints();
  const query = useQuery(adminMerchantQuery(endpoints, merchantId));

  return {
    detail: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
    refetch: () => {
      void query.refetch();
    },
    documentUrl: (documentId: string) =>
      endpoints.merchants.documentContentUrl(merchantId, documentId),
  };
}
