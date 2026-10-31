/**
 * Every currency's balance at a glance (RFC platform-v2 §7).
 *
 * The page's currency selector still drives the cards and the breakdown below; this table is
 * the overview above them, so a merchant whose EUR sales land in a EUR balance sees that
 * money without guessing which currency to pick. Each row selects its currency.
 *
 * Amounts are never summed across currencies — there is no "total in GBP" row, because that
 * would be FX arithmetic and the console does none (`lib/money.ts`).
 */
import type { CurrencyCode } from '@payzeno/contracts';

import { DataTable } from '@components/data/DataTable';
import type { ColumnDef } from '@components/data/DataTable';
import { EmptyRows } from '@components/data/EmptyRows';
import { MoneyCell } from '@components/data/MoneyCell';
import { InlineError } from '@components/feedback/InlineError';
import { currencyLabel } from '@components/form/CurrencySelect';
import { Badge } from '@components/ui/Badge';
import type { CurrencyBalanceRow } from '@/types/view-models';

export interface CurrencyBalancesSummaryProps {
  rows: ReadonlyArray<CurrencyBalanceRow>;
  selected: CurrencyCode;
  isLoading: boolean;
  error: Error | null;
  onSelect: (currency: CurrencyCode) => void;
}

function columns(selected: CurrencyCode): ReadonlyArray<ColumnDef<CurrencyBalanceRow>> {
  return [
    {
      id: 'currency',
      header: 'Currency',
      cell: (row) => (
        <span>
          {currencyLabel(row.currency)}
          {row.currency === selected ? (
            <>
              {' '}
              <Badge tone="brand" size="sm">
                Showing
              </Badge>
            </>
          ) : null}
        </span>
      ),
      exportValue: (row) => row.currency,
    },
    {
      id: 'available_minor',
      header: 'Available',
      align: 'end',
      cell: (row) => <MoneyCell amountMinor={row.available_minor} currency={row.currency} />,
      exportValue: (row) => String(row.available_minor),
    },
    {
      id: 'pending_minor',
      header: 'Pending',
      align: 'end',
      cell: (row) => <MoneyCell amountMinor={row.pending_minor} currency={row.currency} />,
      exportValue: (row) => String(row.pending_minor),
    },
    {
      id: 'reserved_minor',
      header: 'Reserved',
      align: 'end',
      cell: (row) => <MoneyCell amountMinor={row.reserved_minor} currency={row.currency} />,
      exportValue: (row) => String(row.reserved_minor),
    },
    {
      id: 'owed_minor',
      header: 'Owed to Payzeno',
      align: 'end',
      cell: (row) => <MoneyCell amountMinor={row.negative_balance_minor} currency={row.currency} />,
      exportValue: (row) => String(row.negative_balance_minor),
    },
  ];
}

export function CurrencyBalancesSummary({
  rows,
  selected,
  isLoading,
  error,
  onSelect,
}: CurrencyBalancesSummaryProps) {
  return (
    <section aria-labelledby="all-currencies-heading">
      <h2 id="all-currencies-heading">All currencies</h2>
      {error ? (
        <InlineError id="all-currencies-error" severity="status">
          The other currencies could not be loaded. The selected currency below is unaffected.
        </InlineError>
      ) : null}
      <DataTable<CurrencyBalanceRow>
        caption="Your balance in every currency that holds money. Select a row to see its breakdown."
        columns={columns(selected)}
        rows={rows}
        isLoading={isLoading}
        onRowClick={(row) => onSelect(row.currency)}
        emptyState={
          <EmptyRows
            title="No money held yet"
            body="Balances appear per currency as soon as a payment is captured."
          />
        }
      />
    </section>
  );
}
