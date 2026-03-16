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
  const { can } = usePermissions();
  const [tab, setTab] = useStringParam('tab', 'accounts');
  const [addOpen, setAddOpen] = useState(false);
  const [defaultTarget, setDefaultTarget] = useState<string>('');

  const { accounts, isLoading: accountsLoading, error: accountsError } = useBankAccounts();
  // Reused for its `makeDefault` mutation; the row id comes from the table's button.
  const { makeDefault, actionError } = useBankAccount(defaultTarget);

  const { members, isLoading: usersLoading, error: usersError, isForbidden, reload } = useUsers();
  const { inviteUser, isPending: isInviting, errorMessage: inviteError } = useInviteUser();

  const canManageAccounts = can('settings:write');

  const handleMakeDefault = (bankAccountId: string) => {
    setDefaultTarget(bankAccountId);
    makeDefault();
  };

  const handleInvite = (args: { email: string; fullName: string; role: UserRole }) => {
    void inviteUser(args).then((user) => {
      // The legacy path is invisible to `invalidateQueries`, so refresh by hand.
      if (user) reload();
    });
  };

  return (
    <PageContainer as="main">
      <PageHeader
        title="Settings"
        description={`${merchant.display_name} · ${merchant.country} · ${merchant.default_currency}`}
      >
        {tab === 'accounts' ? (
          <Button type="button" disabled={!canManageAccounts} onClick={() => setAddOpen(true)}>
            Add bank account
          </Button>
        ) : null}
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} label="Settings sections" tabs={TABS} />

      {tab === 'accounts' ? (
        <>
          {accountsError ? (
            <ErrorState error={accountsError} title="We could not load your bank accounts" />
          ) : (
            <BankAccountTable
              rows={accounts}
              isLoading={accountsLoading}
              canManage={canManageAccounts}
              onMakeDefault={handleMakeDefault}
            />
          )}
          {actionError ? <ErrorState error={new Error(actionError)} title="Change failed" /> : null}
        </>
      ) : null}

      {tab === 'team' ? (
        <>
          {usersError ? (
            <ErrorState
              error={usersError}
              title={
                isForbidden
                  ? 'You do not have access to the team list'
                  : 'We could not load your team'
              }
            />
          ) : (
            <TeamTable
              members={members}
              isLoading={usersLoading}
              canInvite={can('team:invite')}
              isInviting={isInviting}
              inviteError={inviteError}
              onInvite={handleInvite}
            />
          )}
        </>
      ) : null}

      {tab === 'payouts' ? (
        <Card as="section" aria-label="Payout configuration">
          <h2>Payout schedule</h2>
          <p>
            These are set by Payzeno risk and cannot be changed from the console. Ask support if
            they look wrong.
          </p>
          <dl>
            <dt>Schedule</dt>
            <dd>{humanise(merchant.payout_schedule)}</dd>

            <dt>Funds availability</dt>
            <dd>{pluralise(merchant.payout_delay_days, 'banking day')} after settlement</dd>

            <dt>Rolling reserve</dt>
            <dd>
              {merchant.reserve_bps === 0
                ? 'None'
                : `${formatBps(merchant.reserve_bps)} held for ${pluralise(merchant.reserve_hold_days, 'day')}`}
            </dd>

            <dt>Risk tier</dt>
            <dd>{humanise(merchant.risk_tier)}</dd>

            <dt>Deferred capture</dt>
            <dd>{merchant.capture_at_settlement ? 'On' : 'Off'}</dd>
          </dl>
        </Card>
      ) : null}

      <AddBankAccountDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultCurrency={merchant.default_currency}
        country={merchant.country}
      />
    </PageContainer>
  );
}
