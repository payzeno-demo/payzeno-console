/**
 * `useCharge(id)` — `GET /v1/charges/:chargeId`.
 *
 * `charge.card` is the one name for the card fields — the DB flattens it to `card_brand`,
 * `card_last_four` and friends, but the API and every consumer use the nested object. There
 * is no `payment_method_brand` and there never was.
 */
import { useQuery } from '@tanstack/react-query';

import type { CardSummary, Charge } from '@payzeno/contracts';

import { NotFoundApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';

import { chargeQuery } from './charges.queries';

export interface UseChargeResult {
  charge: Charge | undefined;
  card: CardSummary | undefined;
  refundableMinor: number;
  isLoading: boolean;
  isMissing: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCharge(chargeId: string): UseChargeResult {
  const endpoints = useEndpoints();
  const query = useQuery({ ...chargeQuery(endpoints, chargeId), enabled: chargeId.length > 0 });

  const isMissing = query.error instanceof NotFoundApiError;
  const charge = query.data;

  return {
