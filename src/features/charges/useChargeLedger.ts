/**
 * `useChargeLedger(id)` — `GET /v1/charges/:id/ledger` (api-surface.md §12).
 *
 * arc MIG step 2. Before the ledger owned balances this view did not exist: the legacy
 * biller could tell you a total and nothing else. Now every posting against the charge —
 * auth, capture, fee, settlement, refund, dispute — is visible with its double-entry legs,
 * which is what support actually needs when a merchant asks where their money went.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { LedgerPurpose, LedgerTransaction } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';

import { chargeLedgerQuery } from './charges.queries';

export interface LedgerGroup {
  purpose: LedgerPurpose;
  transactions: LedgerTransaction[];
}

export interface UseChargeLedgerResult {
  transactions: LedgerTransaction[];
  /** Grouped by purpose, in posting order, so the story reads top to bottom. */
  groups: LedgerGroup[];
  /** More than one `settle` transaction on one charge is the arc-INC fingerprint. */
  hasDuplicateSettlement: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useChargeLedger(chargeId: string): UseChargeLedgerResult {
  const endpoints = useEndpoints();
  const query = useQuery({
    ...chargeLedgerQuery(endpoints, chargeId),
