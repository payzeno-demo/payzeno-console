/**
 * `InvoicesPage` — the invoices index route. `InvoiceDetailPage` is its child.
 *
 * The coldest page in the console, and the only one still on the legacy fetch path. It has one
 * test. Both facts are on purpose (blueprint §8.5) and both are tracked: PAY-1902.
 */
import { INVOICE_STATUSES } from '@payzeno/contracts';
import type { InvoiceStatus } from '@payzeno/contracts';

import { DataTable } from '@components/data/DataTable';
import { EmptyRows } from '@components/data/EmptyRows';
import { FilterBar } from '@components/data/FilterBar';
import { ErrorState } from '@components/feedback/ErrorState';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam } from '@hooks/useQueryParamState';
import { humanise } from '@lib/format';

import { LegacyInvoiceNotice } from './components/LegacyInvoiceNotice';
import { invoiceColumns } from './invoices.columns';
import { useInvoices } from './useInvoices';

export function InvoicesPage() {
  useDocumentTitle('Invoices');

  const [status, setStatus] = useEnumParam<InvoiceStatus>('status', INVOICE_STATUSES);
  const { rows, isMixedSource, isLoading, error, isUpstreamDown, refetch } = useInvoices({
