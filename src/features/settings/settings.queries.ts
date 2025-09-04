/**
 * Query/mutation factories for `features/settings` — bank accounts only.
 *
 * The team tab is NOT here. `useUsers` and `useInviteUser` still go through
 * `src/api/legacy/api-fetch.ts`, so they have no `queryOptions` factory, no query key and no
 * participation in invalidation. That is deliberate debt, tracked as PAY-1744, and it is
 * visible in the code rather than described in a comment somewhere: the team table refetches
 * by remounting.
 */
import { queryOptions } from '@tanstack/react-query';

import type { BankAccount, CreateBankAccountRequest, Paginated } from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import { queryKeys } from '@api/queryKeys';

export function bankAccountsQuery(e: EndpointRegistry) {
  return queryOptions<Paginated<BankAccount>>({
    queryKey: queryKeys.bankAccounts.list(),
    queryFn: () => e.bankAccounts.list(),
    // Bank accounts change roughly never; the payout dialog reads this on every open.
    staleTime: 5 * 60 * 1000,
  });
}

export function bankAccountQuery(e: EndpointRegistry, bankAccountId: string) {
  return queryOptions<BankAccount>({
    queryKey: queryKeys.bankAccounts.detail(bankAccountId),
    queryFn: () => e.bankAccounts.get(bankAccountId),
    enabled: bankAccountId.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export interface CreateBankAccountInput {
  request: CreateBankAccountRequest;
}

/**
 * arc PCI: the request carries a `bank_account_token` (`bat_…`) minted by the vault in the
 * browser. The account number never reaches payzeno-api, which is the whole point — a 9-digit
 * ABA routing number is not Luhn-valid, so the PAN redaction rule never caught it and raw
 * numbers used to land in structured request logs.
 */
export function createBankAccountMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['bank_accounts', 'create'] as const,
    mutationFn: ({ request }: CreateBankAccountInput): Promise<BankAccount> =>
      e.bankAccounts.create(request),
  };
}

export function makeDefaultBankAccountMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['bank_accounts', 'default'] as const,
    mutationFn: ({ bankAccountId }: { bankAccountId: string }): Promise<BankAccount> =>
      e.bankAccounts.makeDefault(bankAccountId),
  };
}
