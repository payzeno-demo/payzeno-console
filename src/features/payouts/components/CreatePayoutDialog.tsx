/**
 * Manual payout form.
 *
 * Two constraints are enforced in the UI because the API's error for each is expensive to
 * discover: the destination account must be held in the payout currency (Payzeno does not
 * convert), and the amount cannot exceed the available balance.
 *
 * Leaving the amount at the full available balance sends no `amount_minor` at all, which is
 * what "pay out everything" means to the API and avoids racing a settlement that lands
 * between render and submit.
 */
import { useEffect, useMemo, useState } from 'react';

import type { CurrencyCode, MinorUnits, PayoutMethod } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { Select } from '@components/ui/Select';
import { MoneyInput } from '@components/form/MoneyInput';
import { useMoneyFormat } from '@hooks/useMoneyFormat';
import { labelise, maskLastFour } from '@lib/format';
import { useBankAccounts } from '@features/settings/useBankAccounts';

import { useCreatePayout } from '../useCreatePayout';

const METHODS: ReadonlyArray<PayoutMethod> = ['standard_ach', 'same_day_ach', 'sepa', 'faster_payments'];

export interface CreatePayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: CurrencyCode;
  availableMinor: MinorUnits;
}

export function CreatePayoutDialog({
  open,
  onOpenChange,
  currency,
  availableMinor,
}: CreatePayoutDialogProps) {
  const { accounts, isLoading: accountsLoading } = useBankAccounts();
  const { formatMinor } = useMoneyFormat();
  const { createPayout, isPending, errorMessage, fieldErrors, createdPayout } = useCreatePayout();

  const [amountMinor, setAmountMinor] = useState<MinorUnits>(availableMinor);
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [method, setMethod] = useState<PayoutMethod>('standard_ach');

  // Payzeno never converts, so only accounts in this currency are selectable at all.
  const eligible = useMemo(
    () => accounts.filter((account) => account.currency === currency && account.status === 'validated'),
    [accounts, currency],
  );

  useEffect(() => {
    if (!open) return;
    setAmountMinor(availableMinor);
    const preferred = eligible.find((account) => account.is_default) ?? eligible[0];
    setBankAccountId(preferred?.id ?? '');
  }, [open, availableMinor, eligible]);

  useEffect(() => {
    if (createdPayout) onOpenChange(false);
  }, [createdPayout, onOpenChange]);

  const tooLarge = amountMinor > availableMinor;
  const noAccount = eligible.length === 0;
  const amountError = fieldErrors.amount_minor ?? (tooLarge ? 'More than is available.' : null);

  const handleSubmit = () => {
    if (isPending || tooLarge || tooSmall || noAccount) return;
    createPayout({
      currency,
      amountMinor: amountMinor === availableMinor ? undefined : amountMinor,
      bankAccountId,
      method,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pay out"
      description={`${formatMinor(availableMinor, currency)} available in ${currency}.`}
    >
      {noAccount && !accountsLoading ? (
        <InlineError id="payout-no-account">
          You have no validated {currency} bank account. Add one in Settings first — Payzeno
          does not convert between currencies.
        </InlineError>
      ) : null}

      <MoneyInput
        id="payout-amount"
        label="Amount"
        currency={currency}
        valueMinor={amountMinor}
        onValueChange={setAmountMinor}
        aria-describedby={amountError ? 'payout-amount-error' : undefined}
      />
      {amountError ? <InlineError id="payout-amount-error">{amountError}</InlineError> : null}

      <Select
        id="payout-account"
        label="To account"
        value={bankAccountId}
        onValueChange={setBankAccountId}
        options={eligible.map((account) => ({
          value: account.id,
          label: `${account.bank_name} ${maskLastFour(account.last_four)}${account.is_default ? ' (default)' : ''}`,
        }))}
      />

      <Select
        id="payout-method"
        label="Method"
        value={method}
        onValueChange={(next) => setMethod(next as PayoutMethod)}
        options={METHODS.map((value) => ({ value, label: labelise(value) }))}
      />

      {errorMessage ? <InlineError id="payout-error">{errorMessage}</InlineError> : null}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || tooLarge || tooSmall || noAccount}
      >
        {isPending ? 'Scheduling…' : 'Schedule payout'}
      </Button>
      <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
    </Dialog>
  );
}
