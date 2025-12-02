/**
 * `SettlementDetailPage` — child route of `SettlementsPage`, at
 * `ROUTES.settlements.detail(batchId)`. Renamed from `SettlementBatchPage.tsx` in the
 * PAY-2043 PR.
 *
 * Frame 2 of the canonical chain. It mounts both arc-INC components:
 * `<BatchTotalsPanel/>` (posted vs expected) and, through the item columns,
 * `<DuplicateBadge/>`.
 */
import { useParams } from 'react-router-dom';

import type { ReconciliationItemStatus } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
