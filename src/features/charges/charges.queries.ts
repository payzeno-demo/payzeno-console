import { queryOptions } from '@tanstack/react-query';

import type {
  Charge,
  ChargeLedgerResponse,
  ChargeListQuery,
  Paginated,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import { queryKeys } from '@api/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@config/constants';

/**
 * arc PERF (PAY-1904): the charge list used to default to a status filter plus a
 * created-descending sort that payzeno-api could not serve from an index — it seq-scanned
 * `charge` for every merchant on every page load. Migration 14 added
 * `ix_charge_merchant_created`; this file's half of the fix was narrowing the default so the
 * common case matches that index instead of asking for something clever.
 */
export function chargesListQuery(e: EndpointRegistry, q?: ChargeListQuery) {
  const query: ChargeListQuery = { limit: DEFAULT_PAGE_SIZE, ...(q ?? {}) };
  return queryOptions<Paginated<Charge>>({
    queryKey: queryKeys.charges.list(query),
    queryFn: () => e.charges.list(query),
    staleTime: 20_000,
  });
}

export function chargeQuery(e: EndpointRegistry, chargeId: string) {
  return queryOptions<Charge>({
    queryKey: queryKeys.charges.detail(chargeId),
    queryFn: () => e.charges.get(chargeId),
    staleTime: 15_000,
  });
}

/**
 * `GET /v1/charges/:id/ledger` — added by arc MIG step 2, when balances and statements moved
 * off the legacy biller. payzeno-api reads through to the ledger's
 * `GET /internal/v1/transactions?reference_type=charge&reference_id=…`.
 */
