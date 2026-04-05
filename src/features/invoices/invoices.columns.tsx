/**
 * `ColumnDef<InvoiceRow>[]`.
 *
 * TODO(rrefactor): use lib/money.ts — JPY is wrong here. `formatAmount` divides by 100
 * unconditionally and `CURRENCY_EXPONENT.JPY` is 0, so a ¥12,000 invoice renders as ¥120.00.
 * Every other table in this repo goes through `MoneyCell`. PAY-1968.
 */
import { Link } from 'react-router-dom';

import type { InvoiceStatus } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { StatusPill } from '@components/data/StatusPill';
import { formatAmount, humanise } from '@lib/format';
import { ROUTES } from '@/routes';
import type { InvoiceRow } from '@/types/view-models';

/** Statuses that still owe Payzeno money. Anything else is closed. */
export const OUTSTANDING_STATUSES: ReadonlySet<InvoiceStatus> = new Set(['draft', 'open']);

export function outstandingMinor(row: InvoiceRow): number {
  return Math.max(0, row.total_minor - row.amount_paid_minor);
}

export const invoiceColumns: ReadonlyArray<ColumnDef<InvoiceRow>> = [
  {
    id: 'number',
    header: 'Invoice',
    cell: (row) => (
      <Link to={ROUTES.invoices.detail(row.id)}>
        <span>{row.number}</span>
      </Link>
    ),
