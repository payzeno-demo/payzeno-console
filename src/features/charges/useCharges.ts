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
