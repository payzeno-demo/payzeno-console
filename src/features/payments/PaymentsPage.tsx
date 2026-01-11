/**
 * `PaymentsPage` — the payments index route. `PaymentIntentDetailPage` is its child.
 */
import type { PaymentIntentStatus } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { FilterBar } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useQueryParamState } from '@hooks/useQueryParamState';

import { PaymentIntentTable } from './components/PaymentIntentTable';
import { usePaymentIntents } from './usePaymentIntents';

const STATUS_OPTIONS: ReadonlyArray<PaymentIntentStatus | 'all'> = [
