/**
 * `SettlementsPage` — the settlements index route (`ROUTES.settlements.index`).
 * `SettlementDetailPage` is registered as its child in `src/router.tsx`.
 *
 * Layout plus section components only. The one hook it calls is `useSettlements`.
 */
import type { CurrencyCode, SettlementBatchStatus } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
