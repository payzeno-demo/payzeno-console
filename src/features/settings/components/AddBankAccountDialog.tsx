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

  const [accountHolderName, setAccountHolderName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const accountLabel = scheme === 'iban' ? 'IBAN' : 'Account number';

}
