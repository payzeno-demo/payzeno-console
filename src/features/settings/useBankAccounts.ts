/**
 * `useBankAccounts()` — `GET /v1/bank-accounts` (api-surface.md §12).
 *
 * Also consumed outside settings: `usePayouts` resolves `bank_account_id` to a label with it,
 * and `CreatePayoutDialog` filters it down to the accounts eligible for a currency. The long
 * stale time is what makes that cheap — these rows change once a year.
 *
 * `_coordinates` is pre-formatted per scheme because ABA, IBAN and UK sort codes put the
 * identifying digits in different fields and every call site otherwise re-implements the
 * branch.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { BankAccount, CurrencyCode } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import { maskLastFour } from '@lib/format';
import type { BankAccountRow } from '@/types/view-models';

import { bankAccountsQuery } from './settings.queries';

export interface UseBankAccountsResult {
  accounts: BankAccountRow[];
  accountsById: ReadonlyMap<string, BankAccountRow>;
  defaultFor: (currency: CurrencyCode) => BankAccountRow | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/** Whichever of routing / IBAN / sort code applies to this account's scheme. */
export function coordinatesOf(account: BankAccount): string {
  switch (account.scheme) {
    case 'aba':
      return `Routing ${maskLastFour(account.routing_last_four)}`;
    case 'iban':
      return `IBAN ${maskLastFour(account.iban_last_four)}${account.bic ? ` · ${account.bic}` : ''}`;
    case 'uk_sort_code':
      return `Sort code ${maskLastFour(account.sort_code_last_four)}`;
  }
}

function toRow(account: BankAccount): BankAccountRow {
  return { ...account, _selected: false, _coordinates: coordinatesOf(account) };
}

export function useBankAccounts(): UseBankAccountsResult {
  const endpoints = useEndpoints();
  const query = useQuery(bankAccountsQuery(endpoints));

  const accounts = useMemo(() => (query.data?.data ?? []).map(toRow), [query.data]);

  const accountsById = useMemo(() => {
    const index = new Map<string, BankAccountRow>();
    for (const account of accounts) index.set(account.id, account);
    return index;
  }, [accounts]);

  const defaultFor = useMemo(
    () => (currency: CurrencyCode) =>
      accounts.find((account) => account.currency === currency && account.is_default),
    [accounts],
  );

  return {
    accounts,
    accountsById,
    defaultFor,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
