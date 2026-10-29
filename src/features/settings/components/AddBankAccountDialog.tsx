/**
 * Add a bank account. **arc PCI file** — reviewed by `dhotfix`, and the rules below are not
 * negotiable in review.
 *
 * The account number and routing coordinates are POSTed by the browser **directly** to the
 * vault's public origin (`VITE_VAULT_PUBLIC_URL` → `POST /public/tokens`) and never touch
 * payzeno-api. What crosses our API is a `bat_…` token. This mirrors what
 * `TokenizedCardInput` does for PANs (domain-model.md §11.3).
 *
 * Before PAY-1826 this dialog posted `account_number` straight to `POST /v1/bank-accounts`,
 * and those digits ended up in structured request logs and in `field_errors[].path` — a
 * 9-digit ABA routing number is not Luhn-valid and is outside the 13-19 digit band, so the
 * PAN redaction rule never caught it.
 *
 * Do not add a `console.log` in this file. Do not put the raw value in component state longer
 * than the tokenise call needs it.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';

import type { BankAccountScheme, CurrencyCode } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Label } from '@components/ui/Label';
import { Select } from '@components/ui/Select';
import { Checkbox } from '@components/ui/Checkbox';
import { CurrencySelect } from '@components/form/CurrencySelect';
import { vaultUrl } from '@config/runtime';
import { VaultTokenisationError } from '@lib/errors';
import { labelise } from '@lib/format';

import { useCreateBankAccount } from '../useCreateBankAccount';

const SCHEMES: ReadonlyArray<BankAccountScheme> = ['aba', 'iban', 'uk_sort_code'];

interface VaultTokenResponse {
  token: string;
  last_four: string;
}

/**
 * One of the two network calls in this repo that do not go through `ApiClient`, on purpose:
 * it must reach the vault's origin, not ours, or the whole scope reduction is theatre. The
 * other is `components/form/TokenizedCardInput.tsx`, which does this for PANs.
 */
async function tokeniseBankAccount(fields: {
  scheme: BankAccountScheme;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
}): Promise<string> {
  let response: Response;
  try {
    // eslint-disable-next-line no-restricted-syntax -- ADR 0003: bank details go to the vault's origin, never through ApiClient.
    response = await fetch(vaultUrl('/public/tokens'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'bank_account',
        scheme: fields.scheme,
        account_number: fields.accountNumber,
        routing_number: fields.routingNumber,
        account_holder_name: fields.accountHolderName,
      }),
    });
  } catch {
    throw new VaultTokenisationError('The card vault could not be reached.');
  }

  const vaultReference = response.headers.get('X-Vault-Reference');

  if (!response.ok) {
    throw new VaultTokenisationError(
      `The vault rejected these details (${response.status}).`,
      vaultReference,
    );
  }

  const body = (await response.json()) as VaultTokenResponse;
  return body.token;
}

export interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCurrency: CurrencyCode;
  country: string;
}

export function AddBankAccountDialog({
  open,
  onOpenChange,
  defaultCurrency,
  country,
}: AddBankAccountDialogProps) {
  const [scheme, setScheme] = useState<BankAccountScheme>('aba');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [isTokenising, setIsTokenising] = useState(false);

  const { createBankAccount, isPending, errorMessage, fieldErrors } = useCreateBankAccount();

  const routingLabel = scheme === 'uk_sort_code' ? 'Sort code' : 'Routing number';
  const accountLabel = scheme === 'iban' ? 'IBAN' : 'Account number';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending || isTokenising) return;

    setVaultError(null);
    setIsTokenising(true);

    try {
      const token = await tokeniseBankAccount({
        scheme,
        accountNumber,
        routingNumber,
        accountHolderName,
      });

      // Clear the raw values the moment the vault has them.
      setAccountNumber('');
      setRoutingNumber('');

      createBankAccount({
        country,
        currency,
        scheme,
        bankAccountToken: token,
        accountHolderName,
        isDefault: makeDefault,
      });
    } catch (error: unknown) {
      setVaultError(
        error instanceof VaultTokenisationError
          ? error.message
          : 'We could not securely store those details.',
      );
    } finally {
      setIsTokenising(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add a bank account"
      description="Your account details go straight to our vault. Payzeno never stores them."
    >
      <form onSubmit={handleSubmit} noValidate>
        <Select
          id="bank-scheme"
          label="Account type"
          value={scheme}
          onValueChange={(next) => setScheme(next as BankAccountScheme)}
          options={SCHEMES.map((value) => ({ value, label: labelise(value) }))}
        />

        <CurrencySelect id="bank-currency" value={currency} onChange={setCurrency} />

        <Label htmlFor="bank-holder">Account holder name</Label>
        <Input
          id="bank-holder"
          name="account_holder_name"
          autoComplete="off"
          required
          value={accountHolderName}
          aria-describedby={
            fieldErrors.account_holder_name ? 'bank-holder-error' : undefined
          }
          onChange={(event) => setAccountHolderName(event.target.value)}
        />
        {fieldErrors.account_holder_name ? (
          <InlineError id="bank-holder-error">{fieldErrors.account_holder_name}</InlineError>
        ) : null}

        <Label htmlFor="bank-account-number">{accountLabel}</Label>
        <Input
          id="bank-account-number"
          name="account_number"
          inputMode="numeric"
          autoComplete="off"
          required
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
        />

        {scheme !== 'iban' ? (
          <>
            <Label htmlFor="bank-routing">{routingLabel}</Label>
            <Input
              id="bank-routing"
              name="routing_number"
              inputMode="numeric"
              autoComplete="off"
              required
              value={routingNumber}
              onChange={(event) => setRoutingNumber(event.target.value)}
            />
          </>
        ) : null}

        <Checkbox
          id="bank-default"
          label={`Use as my default ${currency} payout account`}
          checked={makeDefault}
          onCheckedChange={(checked) => setMakeDefault(checked === true)}
        />

        {vaultError ? <InlineError id="bank-vault-error">{vaultError}</InlineError> : null}
        {errorMessage ? <InlineError id="bank-api-error">{errorMessage}</InlineError> : null}

        <Button type="submit" disabled={isPending || isTokenising}>
          {isTokenising ? 'Securing details…' : isPending ? 'Adding…' : 'Add account'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </form>
    </Dialog>
  );
}
