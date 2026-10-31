/**
 * The four tables on a merchant's detail page: KYC documents, users, bank accounts, balances.
 *
 * Documents open as plain same-origin links to `GET /v1/admin/merchants/:id/documents/:doc/content`
 * — "Open" in a new tab (the browser is the viewer), "Download" with the original file name.
 * The bytes never pass through the query cache or the JSON pipeline.
 */
import type { Balance, BankAccount, KycDocument, User } from '@payzeno/contracts';
import { Link } from 'react-router-dom';

import type { ColumnDef } from '@components/data/column.types';
import { DataTable } from '@components/data/DataTable';
import { DateCell, dateExportValue } from '@components/data/DateCell';
import { EmptyRows } from '@components/data/EmptyRows';
import { MoneyCell, moneyExportValue } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { Alert } from '@components/ui/Alert';
import { color, font, space } from '@components/ui/tokens';
import { formatBytes, labelise, maskLastFour } from '@lib/format';

import { ADMIN_ROUTES } from '../../../adminRoutes';

const linkStyle = { color: color.textLink, fontSize: font.size.sm } as const;

export function KycDocumentsTable({
  documents,
  documentUrl,
  isMock,
}: {
  documents: ReadonlyArray<KycDocument>;
  documentUrl: (documentId: string) => string;
  isMock: boolean;
}) {
  const columns: ReadonlyArray<ColumnDef<KycDocument>> = [
    {
      id: 'type',
      header: 'Document',
      exportValue: (doc) => doc.type,
      cell: (doc) => labelise(doc.type),
    },
    {
      id: 'filename',
      header: 'File',
      exportValue: (doc) => doc.filename,
      cell: (doc) => (
        <span style={{ display: 'inline-grid' }}>
          <span>{doc.filename}</span>
          <span style={{ fontSize: font.size.sm, color: color.textSecondary }}>
            {doc.content_type} · {formatBytes(doc.size_bytes)}
          </span>
        </span>
      ),
    },
    {
      id: 'uploaded',
      header: 'Uploaded',
      sortable: true,
      exportValue: (doc) => dateExportValue(doc.uploaded_at),
      cell: (doc) => <DateCell value={doc.uploaded_at} />,
    },
    {
      id: 'actions',
      header: 'View',
      cell: (doc) => (
        <span style={{ display: 'inline-flex', gap: space[3] }}>
          <a
            href={documentUrl(doc.id)}
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
            aria-label={`Open ${doc.filename} in a new tab`}
          >
            Open
          </a>
          <a
            href={documentUrl(doc.id)}
            download={doc.filename}
            style={linkStyle}
            aria-label={`Download ${doc.filename}`}
          >
            Download
          </a>
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: space[3] }}>
      {isMock ? (
        <Alert tone="info" title="Demo data">
          Documents in mock mode are fixtures with no file behind them; the links only open against
          the real api.
        </Alert>
      ) : null}
      <DataTable<KycDocument>
        caption="KYC documents the merchant uploaded"
        columns={columns}
        rows={documents}
        isLoading={false}
        emptyState={<EmptyRows title="No documents" body="The merchant has not uploaded any KYC documents yet." />}
      />
    </div>
  );
}

export function MerchantUsersTable({
  users,
  canLookUpEmails,
}: {
  users: ReadonlyArray<User>;
  canLookUpEmails: boolean;
}) {
  const columns: ColumnDef<User>[] = [
    { id: 'name', header: 'Name', exportValue: (user) => user.full_name, cell: (user) => user.full_name },
    { id: 'email', header: 'Email', exportValue: (user) => user.email, cell: (user) => user.email },
    { id: 'role', header: 'Role', exportValue: (user) => user.role, cell: (user) => labelise(user.role) },
    {
      id: 'last-login',
      header: 'Last sign-in',
      exportValue: (user) => dateExportValue(user.last_login_at),
      cell: (user) => <DateCell value={user.last_login_at} />,
    },
    {
      id: 'created',
      header: 'Added',
      exportValue: (user) => dateExportValue(user.created_at),
      cell: (user) => <DateCell value={user.created_at} />,
    },
  ];

  if (canLookUpEmails) {
    columns.push({
      id: 'emails',
      header: 'Emails',
      cell: (user) => (
        <Link to={ADMIN_ROUTES.emails.lookup(user.email)} style={linkStyle}>
          Emails sent to {user.email}
        </Link>
      ),
    });
  }

  return (
    <DataTable<User>
      caption="People who can sign in to this merchant's console"
      columns={columns}
      rows={users}
      isLoading={false}
      emptyState={<EmptyRows title="No users" body="Nobody has accepted an invite yet." />}
    />
  );
}

export function BankAccountsTable({ accounts }: { accounts: ReadonlyArray<BankAccount> }) {
  const columns: ReadonlyArray<ColumnDef<BankAccount>> = [
    { id: 'bank', header: 'Bank', exportValue: (a) => a.bank_name, cell: (a) => a.bank_name },
    { id: 'account', header: 'Account', exportValue: (a) => a.last_four, cell: (a) => maskLastFour(a.last_four) },
    { id: 'scheme', header: 'Scheme', exportValue: (a) => a.scheme, cell: (a) => labelise(a.scheme) },
    { id: 'currency', header: 'Currency', exportValue: (a) => a.currency, cell: (a) => a.currency },
    { id: 'country', header: 'Country', exportValue: (a) => a.country, cell: (a) => a.country },
    {
      id: 'status',
      header: 'Status',
      exportValue: (a) => a.status,
      cell: (a) => <StatusPill status={a.status} srPrefix="Bank account status" size="sm" />,
    },
    {
      id: 'default',
      header: 'Default',
      exportValue: (a) => (a.is_default ? 'yes' : 'no'),
      cell: (a) => (a.is_default ? 'Default' : '—'),
    },
  ];

  return (
    <DataTable<BankAccount>
      caption="Bank accounts payouts can go to"
      columns={columns}
      rows={accounts}
      isLoading={false}
      emptyState={<EmptyRows title="No bank accounts" body="The merchant has not added a bank account." />}
    />
  );
}

interface BalanceRow extends Balance {
  id: string;
}

export function BalancesTable({ balances }: { balances: ReadonlyArray<Balance> }) {
  const rows: BalanceRow[] = balances.map((balance) => ({ ...balance, id: balance.currency }));
  const money = (read: (b: Balance) => number, header: string, id: string): ColumnDef<BalanceRow> => ({
    id,
    header,
    align: 'end',
    exportValue: (b) => moneyExportValue(read(b), b.currency),
    cell: (b) => <MoneyCell amountMinor={read(b)} currency={b.currency} />,
  });

  const columns: ReadonlyArray<ColumnDef<BalanceRow>> = [
    { id: 'currency', header: 'Currency', exportValue: (b) => b.currency, cell: (b) => b.currency },
    money((b) => b.available_minor, 'Available', 'available'),
    money((b) => b.pending_minor, 'Pending', 'pending'),
    money((b) => b.reserved_minor, 'Reserved', 'reserved'),
    money((b) => b.disputed_minor, 'Disputed', 'disputed'),
    money((b) => b.negative_balance_minor, 'Owed to Payzeno', 'owed'),
  ];

  return (
    <DataTable<BalanceRow>
      caption="Balances per currency"
      columns={columns}
      rows={rows}
      isLoading={false}
      emptyState={<EmptyRows title="No balances" body="No money has moved for this merchant yet." />}
    />
  );
}
