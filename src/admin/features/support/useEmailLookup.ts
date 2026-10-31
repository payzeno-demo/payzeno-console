/**
 * `useEmailLookup(address)` — `GET /v1/admin/emails?to=`: every email Payzeno queued to an
 * address, newest first. Disabled until there is an address to look up.
 */
import type { EmailMessage } from '@payzeno/contracts';
import { useQuery } from '@tanstack/react-query';

import { useAdminEndpoints } from '../../app/AdminApiContext';

import { emailLookupQuery } from './support.queries';

export interface UseEmailLookupResult {
  emails: EmailMessage[];
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useEmailLookup(address: string): UseEmailLookupResult {
  const endpoints = useAdminEndpoints();
  const to = address.trim();
  const query = useQuery({
    ...emailLookupQuery(endpoints, { to, limit: 100 }),
    enabled: to.length > 0,
  });

  return {
    emails: query.data?.data ?? [],
    hasMore: query.data?.has_more ?? false,
    // `isLoading` is false for a disabled query, which is what the empty form wants.
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
