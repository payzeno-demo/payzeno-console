/**
 * `EmailLookupPage` — `/emails?to=` (support). "Did we email them?": every message Payzeno
 * queued to an address, its template, subject and delivery status. Read-only; bodies are not
 * exposed. The address lives in the URL so the answer can be pasted into a ticket.
 */
import type { EmailMessage } from '@payzeno/contracts';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import type { ColumnDef } from '@components/data/column.types';
import { DataTable } from '@components/data/DataTable';
import { DateCell, dateExportValue } from '@components/data/DateCell';
import { EmptyRows } from '@components/data/EmptyRows';
import { FormField } from '@components/form/FormField';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { color, space } from '@components/ui/tokens';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useStringParam } from '@hooks/useQueryParamState';
import { labelise } from '@lib/format';

import { ADMIN_ROUTES } from '../../adminRoutes';
import { AdminQueryError } from '../../components/AdminQueryError';
import { AdminStatusPill } from '../../components/AdminStatusPill';

import { useEmailLookup } from './useEmailLookup';

const columns: ReadonlyArray<ColumnDef<EmailMessage>> = [
  {
    id: 'created',
    header: 'Queued',
    sortable: true,
    exportValue: (row) => dateExportValue(row.created_at),
    cell: (row) => <DateCell value={row.created_at} absolute />,
  },
  {
    id: 'template',
    header: 'Template',
    sortable: true,
    exportValue: (row) => row.template,
    cell: (row) => labelise(row.template),
  },
  { id: 'subject', header: 'Subject', exportValue: (row) => row.subject, cell: (row) => row.subject },
  {
    id: 'status',
    header: 'Delivery',
    sortable: true,
    exportValue: (row) => row.status,
    cell: (row) => <AdminStatusPill kind="email" status={row.status} size="sm" />,
  },
  {
    id: 'sent',
    header: 'Sent',
    exportValue: (row) => dateExportValue(row.sent_at),
    cell: (row) => <DateCell value={row.sent_at} absolute />,
  },
  {
    id: 'merchant',
    header: 'Merchant',
    exportValue: (row) => row.merchant_id ?? '',
    cell: (row) =>
      row.merchant_id ? (
        <Link to={ADMIN_ROUTES.merchants.detail(row.merchant_id)} style={{ color: color.textLink }}>
          {row.merchant_id}
        </Link>
      ) : (
        'Shopper'
      ),
  },
];

export function EmailLookupPage() {
  useDocumentTitle('Email lookup', 'Admin');

  const [to, setTo] = useStringParam('to');
  const [address, setAddress] = useState(to);
  useEffect(() => setAddress(to), [to]);

  const { emails, hasMore, isLoading, isFetching, error, refetch } = useEmailLookup(to);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTo(address.trim());
  };

  return (
    <PageContainer as="main" width="wide">
      <PageHeader
        title="Email lookup"
        description="Every email Payzeno queued to an address — verification, invites, onboarding decisions, receipts — and whether it was delivered."
        isBusy={isFetching && !isLoading}
      />

      <Card as="div">
        <form
          role="search"
          aria-label="Email lookup"
          onSubmit={submit}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: space[3] }}
        >
          <FormField id="email-lookup-address" label="Email address" required>
            {(wiring) => (
              <Input
                id={wiring.id}
                type="email"
                value={address}
                placeholder="someone@example.com"
                describedBy={wiring['aria-describedby']}
                onChange={(event) => setAddress(event.target.value)}
              />
            )}
          </FormField>
          <Button type="submit" variant="primary" disabled={address.trim().length === 0}>
            Look up
          </Button>
        </form>
      </Card>

      <div style={{ marginTop: space[5] }}>
        {!to ? (
          <Alert tone="info" title="Enter an address">
            Results show every email sent to exactly that address, newest first.
          </Alert>
        ) : error ? (
          <AdminQueryError error={error} title="We could not look up that address" what="the email lookup" onRetry={refetch} />
        ) : (
          <DataTable<EmailMessage>
            caption={`Emails sent to ${to}${hasMore ? ' (most recent 100)' : ''}`}
            columns={columns}
            rows={emails}
            isLoading={isLoading}
            emptyState={<EmptyRows title="No emails" body={`Payzeno has not emailed ${to}.`} />}
          />
        )}
      </div>
    </PageContainer>
  );
}
