/**
 * Double-entry detail for one charge. Added by arc MIG step 2, when
 * `GET /v1/charges/:id/ledger` landed and the ledger became the source of truth for money
 * movement.
 *
 * Debits and credits are shown as the ledger records them, not netted. Support has to be
 * able to read this alongside the ledger's own `/internal/v1/transactions` output, and a
 * "helpful" simplification here is how you end up unable to explain a 4p discrepancy.
 */
import type { CurrencyCode, LedgerEntry } from '@payzeno/contracts';

import { Alert } from '@components/ui/Alert';
import { Card } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';

import { useChargeLedger } from '../useChargeLedger';

export interface ChargeLedgerPanelProps {
  chargeId: string;
  currency: CurrencyCode;
}

function entryLabel(entry: LedgerEntry): string {
  return `${entry.direction === 'debit' ? 'Dr' : 'Cr'} ${entry.account_id}`;
}

export function ChargeLedgerPanel({ chargeId, currency }: ChargeLedgerPanelProps) {
  const { groups, hasDuplicateSettlement, isLoading, error } = useChargeLedger(chargeId);

  if (isLoading) {
    return <Skeleton height="12rem" aria-label="Loading ledger detail" />;
  }

  if (error) {
    return (
      <Alert tone="warning" title="Ledger detail is unavailable">
        The ledger did not answer in time. The charge itself is unaffected.
      </Alert>
    );
  }

  return (
    <Card as="section" aria-label="Ledger detail">
      <h2>Ledger</h2>

      {hasDuplicateSettlement ? (
        <Alert tone="critical" title="This charge has more than one settlement posting">
          Contact support with this charge id. A duplicate settlement is internally balanced,
          so it will not show up as a discrepancy in your totals.
        </Alert>
      ) : null}

      {groups.length === 0 ? (
        <p>Nothing has been posted against this charge yet.</p>
      ) : (
        groups.map((group) => (
          <section key={group.purpose} aria-label={`${group.purpose} transactions`}>
            <h3>{group.purpose.replace(/_/g, ' ')}</h3>

            {group.transactions.map((transaction) => (
              <article key={transaction.id}>
                <header>
                  <IdCell value={transaction.id} />
                  <DateCell value={transaction.posted_at} precision="second" />
                </header>

                <ul>
                  {transaction.entries.map((entry) => (
                    <li key={entry.id}>
                      <span>{entryLabel(entry)}</span>
                      <MoneyCell amountMinor={entry.amount_minor} currency={currency} />
                    </li>
                  ))}
