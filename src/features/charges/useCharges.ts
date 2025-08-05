/**
 * `useCharges(q)` — `GET /v1/charges` (api-surface.md §12).
 *
 * arc PERF: the sort/filter combination this hook sends is the one that made payzeno-api
 * seq-scan. It now sends nothing payzeno-api cannot serve from `ix_charge_merchant_created`
 * unless the merchant explicitly asks for a narrower filter.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Charge, ChargeListQuery } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import type { ChargeRow } from '@types/view-models';

import { chargesListQuery } from './charges.queries';

export interface UseChargesResult {
  rows: ChargeRow[];
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

function toRow(charge: Charge): ChargeRow {
  const refundableMinor = charge.captured_amount_minor - charge.refunded_amount_minor;
  return {
    ...charge,
    _selected: false,
    _refundableMinor: refundableMinor,
    // Only a captured charge can be refunded. An `authorized` one takes a cancel, which
    // voids the authorisation — a void is not a refund (domain-model.md §4).
    _isRefundable:
      (charge.status === 'captured' || charge.status === 'settled') && refundableMinor > 0,
  };
}

export function useCharges(q?: ChargeListQuery): UseChargesResult {
  const endpoints = useEndpoints();
  const query = useQuery(chargesListQuery(endpoints, q));

  const rows = useMemo(() => (query.data?.data ?? []).map(toRow), [query.data]);

  return {
