/**
 * `useBankAccount(id)` — `GET /v1/bank-accounts/:bankAccountId` (api-surface.md §12).
 *
 * This route exists because `ResourceEndpoint.get(id)` is mandatory on all ten concretes —
 * see interfaces.md §4.2. It is genuinely used: the payout detail page links to the account it
 * paid, and a merchant arriving from a `payout.failed` email lands on an id and nothing else.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { BankAccount } from '@payzeno/contracts';

import { ConsoleApiError, ForbiddenError, NotFoundApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { coordinatesOf } from './useBankAccounts';
import { bankAccountQuery, makeDefaultBankAccountMutation } from './settings.queries';

export interface UseBankAccountResult {
  account: BankAccount | undefined;
  coordinates: string;
  isUsable: boolean;
  isLoading: boolean;
  isMissing: boolean;
  error: Error | null;
  makeDefault: () => void;
  isSettingDefault: boolean;
  actionError: string | null;
}

export function useBankAccount(bankAccountId: string): UseBankAccountResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery(bankAccountQuery(endpoints, bankAccountId));
  const account = query.data;
  const isMissing = query.error instanceof NotFoundApiError;

  const mutation = useMutation({
    ...makeDefaultBankAccountMutation(endpoints),
    onSuccess: async (updated: BankAccount) => {
      toast.success(`${updated.bank_name} is now your default ${updated.currency} account.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.detail(updated.id) }),
      ]);
    },
    onError: (error: unknown) => {
      if (error instanceof ForbiddenError) {
        setActionError('Changing the default account needs an admin role.');
        return;
      }
      setActionError(
        error instanceof ConsoleApiError ? error.message : 'That change could not be saved.',
      );
    },
  });

  const makeDefault = useCallback(() => {
    if (!account) return;
    setActionError(null);
    mutation.mutate({ bankAccountId: account.id });
  }, [account, mutation]);

  return {
    account,
    coordinates: account ? coordinatesOf(account) : '—',
    // Only a validated account can receive a payout; `new` is still being verified.
    isUsable: account?.status === 'validated',
    isLoading: query.isLoading,
    isMissing,
    error: isMissing ? null : ((query.error as Error | null) ?? null),
    makeDefault,
    isSettingDefault: mutation.isPending,
    actionError,
  };
}
