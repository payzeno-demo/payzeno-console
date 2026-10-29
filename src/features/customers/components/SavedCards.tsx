/**
 * A customer's saved cards, each removable after a confirmation (RFC platform-v2 §5).
 *
 * The card is shown the only way the console can show one: brand, last four, expiry, country
 * (ADR 0003). The remove button names the card, so a screen-reader user hears which one.
 */
import { useState } from 'react';

import { CardBrandCell } from '@components/data/CardBrandCell';
import { DataTable } from '@components/data/DataTable';
import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { EmptyRows } from '@components/data/EmptyRows';
import { InlineError } from '@components/feedback/InlineError';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import type { PaymentMethodRow } from '@/types/view-models';

export interface SavedCardsProps {
  rows: ReadonlyArray<PaymentMethodRow>;
  isLoading: boolean;
  canRemove: boolean;
  onRemove: (paymentMethodId: string) => void;
  pendingId: string | null;
  errorMessage: string | null;
}

function describe(row: PaymentMethodRow): string {
  return `${row.card.brand} ending ${row.card.last_four}`;
}

export function SavedCards({
  rows,
  isLoading,
  canRemove,
  onRemove,
  pendingId,
  errorMessage,
}: SavedCardsProps) {
  const [confirming, setConfirming] = useState<PaymentMethodRow | null>(null);

  const columns: ReadonlyArray<ColumnDef<PaymentMethodRow>> = [
    {
      id: 'card',
      header: 'Card',
      cell: (row) => (
        <span>
          <CardBrandCell
            brand={row.card.brand}
            lastFour={row.card.last_four}
            funding={row.card.funding}
            country={row.card.country}
          />
          {row._isDefault ? (
            <>
              {' '}
              <Badge tone="brand" size="sm">
                Default
              </Badge>
            </>
          ) : null}
        </span>
      ),
      exportValue: (row) => describe(row),
    },
    {
      id: 'expiry',
      header: 'Expires',
      cell: (row) => (
        <span>
          {String(row.card.exp_month).padStart(2, '0')}/{row.card.exp_year}
          {row._isExpired ? (
            <>
              {' '}
              <Badge tone="danger" size="sm">
                Expired
              </Badge>
            </>
          ) : null}
        </span>
      ),
      exportValue: (row) => `${row.card.exp_month}/${row.card.exp_year}`,
    },
    {
      id: 'created_at',
      header: 'Saved',
      cell: (row) => <DateCell value={row.created_at} />,
      exportValue: (row) => row.created_at,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!canRemove || pendingId === row.id}
          aria-label={`Remove ${describe(row)}`}
          onClick={() => setConfirming(row)}
        >
          {pendingId === row.id ? 'Removing…' : 'Remove'}
        </Button>
      ),
    },
  ];

  return (
    <>
      {errorMessage ? <InlineError id="saved-cards-error">{errorMessage}</InlineError> : null}
      <DataTable<PaymentMethodRow>
        caption="Cards this customer saved at checkout"
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        emptyState={
          <EmptyRows
            title="No saved cards"
            body="A card is saved when the customer ticks “Save card” at checkout or starts a subscription."
          />
        }
      />

      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
        title="Remove saved card?"
        description={
          confirming
            ? `The ${describe(confirming)} will no longer be offered at checkout. Subscriptions renewing on it fall back to the customer's default card, and fail if there is none.`
            : undefined
        }
        destructive
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirming(null)}>
              Keep card
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (confirming) onRemove(confirming.id);
                setConfirming(null);
              }}
            >
              Remove card
            </Button>
          </>
        }
      >
        <p>This cannot be undone; the customer would need to save the card again.</p>
      </Dialog>
    </>
  );
}
