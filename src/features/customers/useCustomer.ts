/**
 * `useCustomer(id)` — `GET /v1/customers/:customerId` (RFC platform-v2 §5).
 */
import { useQuery } from '@tanstack/react-query';

import type { Customer } from '@payzeno/contracts';

import { NotFoundApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';

import { customerQuery } from './customers.queries';

export interface UseCustomerResult {
  customer: Customer | undefined;
  isLoading: boolean;
  isMissing: boolean;
  error: Error | null;
}

export function useCustomer(id: string): UseCustomerResult {
  const endpoints = useEndpoints();
  const query = useQuery({ ...customerQuery(endpoints, id), enabled: id.length > 0 });
  const isMissing = query.error instanceof NotFoundApiError;

  return {
    customer: query.data,
    isLoading: query.isLoading,
    isMissing,
    error: isMissing ? null : (query.error as Error | null) ?? null,
  };
}
