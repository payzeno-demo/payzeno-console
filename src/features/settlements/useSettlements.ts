/**
 * `useSettlements(q)` — `GET /v1/settlements` (api-surface.md §12).
 *
 * The rows are `MerchantSettlementBatch`, never `SettlementBatch`: acquirer-level totals
 * belong to every merchant in the file at once and are not returned on a session-authed
 * route.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { MerchantSettlementBatch } from '@payzeno/contracts';

import type { SettlementListQuery } from '@api/endpoints/settlements.endpoint';
import { useEndpoints } from '@app/ApiContext';
import type { SettlementRow } from '@types/view-models';

import { settlementsListQuery } from './settlements.queries';

export interface UseSettlementsResult {
  rows: SettlementRow[];
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

function toRow(batch: MerchantSettlementBatch): SettlementRow {
  return {
    ...batch,
    _selected: false,
    // Only a funded batch has actually released money to the merchant; everything before
    // that is an accounting position, and merchants read the two as the same thing.
    _isFunded: batch.status === 'funded',
    _needsAttention: batch.status === 'failed' || batch.status === 'partially_reconciled',
  };
}

export function useSettlements(q?: SettlementListQuery): UseSettlementsResult {
  const endpoints = useEndpoints();
  const query = useQuery(settlementsListQuery(endpoints, q));

  const rows = useMemo(() => (query.data?.data ?? []).map(toRow), [query.data]);

