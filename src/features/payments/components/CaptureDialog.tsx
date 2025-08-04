/**
 * Partial-capture dialog. Manual-capture intents can be captured for less than the
 * authorised amount (the remainder is released), so the amount is editable — but it is
 * pre-filled with the full amount, because that is what almost everyone wants.
 *
 * `MoneyInput` works in minor units throughout. There is no `* 100` in this file: JPY has a
 * zero exponent and `lib/money.ts` is the only thing allowed to know that.
 */
import { useState } from 'react';

import type { CurrencyCode, MinorUnits } from '@payzeno/contracts';

import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { InlineError } from '@components/feedback/InlineError';
import { MoneyInput } from '@components/form/MoneyInput';
import { useMoneyFormat } from '@hooks/useMoneyFormat';

import { useCapturePaymentIntent } from '../useCapturePaymentIntent';

export interface CaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentIntentId: string;
  authorisedMinor: MinorUnits;
  currency: CurrencyCode;
}

export function CaptureDialog({
  open,
  onOpenChange,
  paymentIntentId,
  authorisedMinor,
  currency,
}: CaptureDialogProps) {
  const [amountMinor, setAmountMinor] = useState<MinorUnits>(authorisedMinor);
  const { format } = useMoneyFormat();
  const { capture, isPending, errorMessage } = useCapturePaymentIntent();

  const tooLarge = amountMinor > authorisedMinor;
  const tooSmall = amountMinor <= 0;

  const handleCapture = () => {
    if (tooLarge || tooSmall || isPending) return;
    capture({
      paymentIntentId,
      amountMinor: amountMinor === authorisedMinor ? undefined : amountMinor,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Capture payment"
      description={`Authorised for ${format({ amount_minor: authorisedMinor, currency })}.`}
    >
      <MoneyInput
        id="capture-amount"
        label="Amount to capture"
        currency={currency}
        valueMinor={amountMinor}
        onValueChange={setAmountMinor}
        aria-describedby={tooLarge ? 'capture-amount-error' : undefined}
      />

      {tooLarge ? (
        <InlineError id="capture-amount-error">
          You cannot capture more than the authorised amount.
        </InlineError>
      ) : null}

      {amountMinor < authorisedMinor && !tooSmall ? (
        <p>
          The remaining {format({ amount_minor: authorisedMinor - amountMinor, currency })} will be
          released back to the cardholder.
        </p>
      ) : null}

      {errorMessage ? <InlineError id="capture-error">{errorMessage}</InlineError> : null}

      <Button type="button" onClick={handleCapture} disabled={isPending || tooLarge || tooSmall}>
        {isPending ? 'Capturing…' : 'Capture'}
      </Button>
      <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
    </Dialog>
  );
}
