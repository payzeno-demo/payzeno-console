/**
 * Manual payout form.
 *
 * The amount cannot exceed the available balance, and that is enforced here because the API's
 * error for it is expensive to discover.
 *
 * RFC platform-v2 §7: the destination account no longer has to be held in the balance's
 * currency. `currency` on the request is the *balance* being paid out; when the account is in
 * another currency the ledger converts at payout time (provider rate + 1%) and the payout
 * records `source_*` and `fx_rate`. The form says so before the merchant commits, and does no
 * arithmetic of its own — the rate is the ledger's, at the moment it pays.
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

  // Any validated account. Same-currency accounts first, because a payout that does not
  // convert is the cheaper one and the merchant should not have to hunt for it.
  const eligible = useMemo(
    () =>
      accounts
        .filter((account) => account.status === 'validated')
        .sort(
          (a, b) => Number(b.currency === currency) - Number(a.currency === currency),
        ),
    [accounts, currency],
  );

  useEffect(() => {
    if (!open) return;
    setAmountMinor(availableMinor);
    const sameCurrency = eligible.filter((account) => account.currency === currency);
    const preferred =
      sameCurrency.find((account) => account.is_default) ?? sameCurrency[0] ?? eligible[0];
    setBankAccountId(preferred?.id ?? '');
  }, [open, availableMinor, eligible, currency]);

  const target = eligible.find((account) => account.id === bankAccountId);
  const converts = target !== undefined && target.currency !== currency;

  useEffect(() => {
    if (createdPayout) onOpenChange(false);
  }, [createdPayout, onOpenChange]);

  const tooLarge = amountMinor > availableMinor;
  const tooSmall = amountMinor <= 0;
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
          You have no validated bank account. Add one in Settings first.
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
          label: `${account.bank_name} ${maskLastFour(account.last_four)} · ${account.currency}${account.is_default ? ' (default)' : ''}`,
          ...(account.currency === currency
            ? {}
            : { description: `Converts ${currency} to ${account.currency}` }),
        }))}
      />

      {converts && target ? (
        <p role="status" data-testid="payout-conversion-note">
          This account is held in {target.currency}. Payzeno converts your {currency} balance to{' '}
          {target.currency} when the payout is sent, at the provider rate plus a 1% conversion
          fee. The exact rate and the {target.currency} amount appear on the payout once it is
          sent.
        </p>
      ) : null}

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
