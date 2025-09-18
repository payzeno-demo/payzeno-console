/**
 * Query/mutation factories for `features/settlements`. The ONLY caller of
 * `SettlementsEndpoint` in the repo.
 *
 * Renamed from `settlementQueries.ts` in the PAY-2043 PR, along with five sibling files —
 * `rrefactor` does not do small diffs.
 */
import { queryOptions } from '@tanstack/react-query';

import type {
  MerchantSettlementBatch,
