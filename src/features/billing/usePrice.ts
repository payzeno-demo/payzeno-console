/**
 * `usePrice(id)` — `GET /v1/prices/:priceId` (RFC platform-v2 §6).
 */
import { useQuery } from '@tanstack/react-query';

import type { Price } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';

import { priceQuery } from './billing.queries';

export function usePrice(id: string | null): { price: Price | undefined; isLoading: boolean } {
  const endpoints = useEndpoints();
  const query = useQuery({ ...priceQuery(endpoints, id ?? ''), enabled: Boolean(id) });
  return { price: query.data, isLoading: Boolean(id) && query.isLoading };
}
