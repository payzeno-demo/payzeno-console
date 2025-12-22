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
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Badge } from '@components/ui/Badge';
import { DateCell } from '@components/data/DateCell';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useQueryParamState } from '@hooks/useQueryParamState';

import { BatchTotalsPanel } from './components/BatchTotalsPanel';
import { SettlementItemTable } from './components/SettlementItemTable';
import { useSettlement } from './useSettlement';
import { useSettlementItems } from './useSettlementItems';
