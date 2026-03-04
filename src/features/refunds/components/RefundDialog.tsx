/**
 * The one refund form in this repo. Opened from `ChargeDetailPage` and from the charges
 * table's row action.
 *
 * Everything is in minor units. There is no `* 100` here — `MoneyInput` speaks minor units
 * and `lib/money.ts` owns the exponent, which is the whole reason `formatAmount` in
 * `lib/format.ts` is a bug and this is not.
 *
 * a11y: the amount error is wired with `aria-describedby`, and the confirmation summary is a
 * live region so a screen reader hears the amount change as the user types.
 */
import { useEffect, useState } from 'react';

import type { CurrencyCode, MinorUnits, RefundReason } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { Select } from '@components/ui/Select';
import { MoneyInput } from '@components/form/MoneyInput';
import { useMoneyFormat } from '@hooks/useMoneyFormat';
import { humanise } from '@lib/format';

import { useCreateRefund } from '../useCreateRefund';

/** `expired_uncaptured_auth` is system-generated and is deliberately not offered here. */
const SELECTABLE_REASONS: ReadonlyArray<RefundReason> = [
  'requested_by_customer',
  'duplicate',
  'fraudulent',
];

export interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargeId: string;
  currency: CurrencyCode;
  refundableMinor: MinorUnits;
}

export function RefundDialog({
  open,
  onOpenChange,
  chargeId,
  currency,
  refundableMinor,
}: RefundDialogProps) {
  const [amountMinor, setAmountMinor] = useState<MinorUnits>(refundableMinor);
  const [reason, setReason] = useState<RefundReason>('requested_by_customer');
  const { formatMinor } = useMoneyFormat();
  const { createRefund, isPending, errorMessage, fieldErrors, lastRefund, reset } =
    useCreateRefund();

  // Re-prefill whenever the dialog is reopened against a different charge.
  useEffect(() => {
    if (open) {
      setAmountMinor(refundableMinor);
      reset();
    }
  }, [open, refundableMinor, reset]);

  // A successful refund closes the dialog; the charge page shows the new balance.
  useEffect(() => {
    if (lastRefund) onOpenChange(false);
  }, [lastRefund, onOpenChange]);

  const tooLarge = amountMinor > refundableMinor;
  const tooSmall = amountMinor <= 0;
  const amountError = fieldErrors.amount_minor ?? (tooLarge ? 'More than is refundable.' : null);
  const isPartial = amountMinor < refundableMinor && !tooSmall;

  const handleSubmit = () => {
    if (isPending || tooLarge || tooSmall) return;
    createRefund({
      chargeId,
      // Omitting the amount means "refund everything still refundable", which is what the
      // API does with no `amount_minor` — and it avoids a race with a concurrent refund.
      amountMinor: amountMinor === refundableMinor ? undefined : amountMinor,
      reason,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Refund this charge"
      description={`${formatMinor(refundableMinor, currency)} is still refundable.`}
    >
      <MoneyInput
        id="refund-amount"
        label="Refund amount"
        currency={currency}
        valueMinor={amountMinor}
        onValueChange={setAmountMinor}
        aria-describedby={amountError ? 'refund-amount-error' : 'refund-summary'}
      />
      {amountError ? <InlineError id="refund-amount-error">{amountError}</InlineError> : null}

      <Select
        id="refund-reason"
        label="Reason"
        value={reason}
