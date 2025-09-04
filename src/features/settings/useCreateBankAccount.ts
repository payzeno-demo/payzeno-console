/**
 * `useCreateBankAccount()` — `POST /v1/bank-accounts`.
 *
 * arc PCI. The hook never sees an account number: `AddBankAccountDialog` tokenises the
 * credentials against the vault's public origin and passes the resulting `bat_…` token here.
 * Before PAY-1826 this hook took `account_number` and `routing_number` as plain strings, and
 * those strings ended up in `field_errors[].path`, in structured request logs and in APM
 * traces, because a routing number is not Luhn-valid and the PAN redaction rule skipped it.
 *
 * If you are about to add a field to `CreateBankAccountRequest` that holds raw credentials:
 * don't. Tokenise it in the browser.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type {
  BankAccount,
  BankAccountScheme,
  CreateBankAccountRequest,
  CurrencyCode,
} from '@payzeno/contracts';

import { ConsoleApiError, ForbiddenError, ValidationApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';
import { VaultTokenisationError } from '@lib/errors';
import { trackEvent } from '@lib/telemetry';

import { createBankAccountMutation } from './settings.queries';

export interface CreateBankAccountArgs {
  country: string;
  currency: CurrencyCode;
  scheme: BankAccountScheme;
  /** Opaque vault token. Never an account number. */
  bankAccountToken: string;
  accountHolderName: string;
  isDefault?: boolean;
}

export interface UseCreateBankAccountResult {
  createBankAccount: (args: CreateBankAccountArgs) => void;
  isPending: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
  createdAccount: BankAccount | null;
}

export function useCreateBankAccount(): UseCreateBankAccountResult {
  const endpoints = useEndpoints();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
}
