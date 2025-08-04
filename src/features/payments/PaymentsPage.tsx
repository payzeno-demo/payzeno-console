/**
 * `PaymentsPage` — the payments index route. `PaymentIntentDetailPage` is its child.
 */
import type { PaymentIntentStatus } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { FilterBar } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
