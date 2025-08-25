/**
 * `InvoiceDetailPage` — child route of `InvoicesPage`.
 *
 * Still on the legacy path: `useLegacyQuery` straight onto `GET /v1/invoices/:invoiceId`. The
 * line items come from payzeno-billing-legacy's JPA model verbatim, which is why they are a
 * plain array on the invoice rather than a paginated sub-resource.
 *
 * Voiding an invoice is admin-only and, because nothing here participates in invalidation,
 * refetches by hand.
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import type { Invoice } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { DateCell } from '@components/data/DateCell';
import { StatusPill } from '@components/data/StatusPill';
import { useLegacyQuery } from '@api/legacy/legacy-query';
import { legacyStatus } from '@api/legacy/legacy-errors';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
// TODO(rrefactor): MoneyCell — same JPY bug as invoices.columns.tsx. PAY-1968.
import { formatAmount, formatCount, humanise } from '@lib/format';

import { voidInvoice } from './invoices.queries';

export function InvoiceDetailPage() {
  const { invoiceId = '' } = useParams<{ invoiceId: string }>();
  useDocumentTitle(invoiceId ? `Invoice ${invoiceId}` : 'Invoice');

  const canVoid = can('settings:write') && (data.status === 'draft' || data.status === 'open');

}
