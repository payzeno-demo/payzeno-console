/**
 * The debit-balance banner.
 *
 * `negative_balance_minor > 0` means refunds and chargebacks have driven the merchant's
 * payable account into debit with no incoming volume to absorb it — the merchant owes
 * Payzeno. Payouts are blocked while it stands, and a `debit_ach` payout is how it gets
 * recovered.
 *
 * This is deliberately loud and deliberately not dismissible: a merchant who does not know
 * they are in debit finds out when a payout is refused.
 */
import type { CurrencyCode, MinorUnits } from '@payzeno/contracts';

import { Alert } from '@components/ui/Alert';
import { useMoneyFormat } from '@hooks/useMoneyFormat';

export interface NegativeBalanceAlertProps {
  negativeMinor: MinorUnits;
  currency: CurrencyCode;
  /** Rendered when the merchant may act on it — owners and admins. */
  onContactSupport?: () => void;
}

export function NegativeBalanceAlert({
  negativeMinor,
  currency,
  onContactSupport,
}: NegativeBalanceAlertProps) {
  const { formatMinor } = useMoneyFormat();

  if (negativeMinor <= 0) return null;

  return (
    <Alert tone="critical" title="Your balance is negative" role="alert">
      <p>
        Refunds and chargebacks have taken your balance {formatMinor(negativeMinor, currency)}{' '}
        below zero. New payouts are blocked until incoming volume clears it, or until we recover
        the amount by debit from your bank account.
      </p>
      {onContactSupport ? (
        <button type="button" onClick={onContactSupport}>
          Contact support
        </button>
      ) : null}
    </Alert>
  );
}
