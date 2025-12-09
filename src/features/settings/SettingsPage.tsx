/**
 * `SettingsPage` — bank accounts, the team, and the merchant's payout configuration.
 *
 * Two data paths meet on this page and they do not behave the same way. Bank accounts go
 * through `BankAccountsEndpoint` and TanStack Query: adding one invalidates the list and the
 * table updates. The team tab goes through `src/api/legacy/api-fetch.ts`: after an invite the
 * page has to call `reload()` itself, and a 403 renders the generic error rather than
 * `<PermissionDenied/>`, because `error-mapper.ts` never sees that response.
 *
 * That asymmetry is PAY-1744 and it is deliberate until the migration lands.
 */
import { useState } from 'react';

import type { UserRole } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Tabs } from '@components/ui/Tabs';
import { useCurrentMerchant } from '@app/SessionContext';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
import { useStringParam } from '@hooks/useQueryParamState';
import { formatBps } from '@lib/money';
import { humanise, pluralise } from '@lib/format';

import { AddBankAccountDialog } from './components/AddBankAccountDialog';
import { BankAccountTable } from './components/BankAccountTable';
import { TeamTable } from './components/TeamTable';
import { useBankAccount } from './useBankAccount';
import { useBankAccounts } from './useBankAccounts';
import { useInviteUser } from './useInviteUser';
import { useUsers } from './useUsers';

const TABS = [
  { value: 'accounts', label: 'Bank accounts' },
  { value: 'team', label: 'Team' },
  { value: 'payouts', label: 'Payout schedule' },
];

export function SettingsPage() {
  useDocumentTitle('Settings');

  const merchant = useCurrentMerchant();
  const { accounts, isLoading: accountsLoading, error: accountsError } = useBankAccounts();
  // Reused for its `makeDefault` mutation; the row id comes from the table's button.
  const { makeDefault, actionError } = useBankAccount(defaultTarget);

  const { members, isLoading: usersLoading, error: usersError, isForbidden, reload } = useUsers();
  const canManageAccounts = can('settings:write');

  const handleMakeDefault = (bankAccountId: string) => {
    setDefaultTarget(bankAccountId);
    makeDefault();
  };

}
