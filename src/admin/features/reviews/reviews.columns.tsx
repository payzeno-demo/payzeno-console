/**
 * Columns for the risk review queue.
 */
import type { Review } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/column.types';
import { DateCell, dateExportValue } from '@components/data/DateCell';
import { MoneyCell, moneyExportValue } from '@components/data/MoneyCell';
import { Badge } from '@components/ui/Badge';
import { space } from '@components/ui/tokens';

import { AdminStatusPill } from '../../components/AdminStatusPill';

import { countryMismatch, ruleLabel, scoreBand } from './review-format';

export const reviewColumns: ReadonlyArray<ColumnDef<Review>> = [
  {
    id: 'review',
    header: 'Review',
    exportValue: (row) => row.id,
    cell: (row) => <code>{row.id}</code>,
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    sortable: true,
    exportValue: (row) => moneyExportValue(row.amount_minor, row.currency),
    cell: (row) => <MoneyCell amountMinor={row.amount_minor} currency={row.currency} />,
  },
  {
    id: 'score',
    header: 'Risk score',
    align: 'end',
    sortable: true,
    exportValue: (row) => String(row.risk_score).padStart(3, '0'),
    cell: (row) => {
      const band = scoreBand(row.risk_score);
      return (
        <Badge tone={band.tone} size="sm" srPrefix="Risk score">
          {row.risk_score} · {band.label}
        </Badge>
      );
    },
  },
  {
    id: 'rules',
    header: 'Rules',
    exportValue: (row) => row.rules.join(' '),
    cell: (row) => (
      <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: space[1] }}>
        {row.rules.map((rule) => (
          <Badge key={rule} tone="neutral" size="sm">
            {ruleLabel(rule)}
          </Badge>
        ))}
      </span>
    ),
  },
  {
    id: 'countries',
    header: 'Shopper / card',
    exportValue: (row) => `${row.ip_country ?? ''}/${row.card_country ?? ''}`,
    cell: (row) => {
      const mismatch = countryMismatch(row);
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: space[2] }}>
          <span>
            {row.ip_country ?? '??'} / {row.card_country ?? '??'}
          </span>
          {mismatch ? (
            <Badge tone="danger" size="sm">
              Mismatch
            </Badge>
          ) : mismatch === null ? (
            <Badge tone="warning" size="sm">
              Location unknown
            </Badge>
          ) : null}
        </span>
      );
    },
  },
  {
    id: 'merchant',
    header: 'Merchant',
    exportValue: (row) => row.merchant_id,
    cell: (row) => <code>{row.merchant_id}</code>,
  },
  {
    id: 'opened',
    header: 'Opened',
    sortable: true,
    exportValue: (row) => dateExportValue(row.opened_at),
    cell: (row) => <DateCell value={row.opened_at} />,
  },
  {
    id: 'status',
    header: 'Status',
    exportValue: (row) => row.status,
    cell: (row) => <AdminStatusPill kind="review" status={row.status} size="sm" />,
  },
];
