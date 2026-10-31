/**
 * `MerchantDetailPage` — `/merchants/:merchantId`.
 *
 * Everything a reviewer needs to decide on an application, top to bottom: the action bar, the
 * merchant record, the business profile and representative as the merchant submitted them,
 * the KYC documents (open / download), the users, bank accounts and balances. Every action
 * goes through a confirmation dialog, shows its outcome above the page, and refetches.
 */
import type { AdminMerchantDetail } from '@payzeno/contracts';
import { useParams } from 'react-router-dom';

import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { PageContainer, PageSections } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Card } from '@components/ui/Card';
import { space } from '@components/ui/tokens';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { assertDefined } from '@lib/assert';
import { labelise, listSentence } from '@lib/format';
import { formatBps } from '@lib/money';

import { ADMIN_ROUTES } from '../../adminRoutes';
import { useAdminTransportIsMock } from '../../app/AdminApiContext';
import { useStaffPermissions } from '../../app/StaffSessionContext';
import { ActionOutcomeAlert } from '../../components/ActionOutcome';
import { AdminQueryError } from '../../components/AdminQueryError';
import { AdminStatusPill } from '../../components/AdminStatusPill';
import { DetailList } from '../../components/DetailList';

import { MerchantActions } from './components/MerchantActions';
import {
  BalancesTable,
  BankAccountsTable,
  KycDocumentsTable,
  MerchantUsersTable,
} from './components/MerchantTables';
import { useAdminMerchant } from './useAdminMerchant';
import { useMerchantDecision, useMerchantStatus } from './useMerchantActions';

export function MerchantDetailPage() {
  const merchantId = assertDefined(useParams().merchantId, 'MerchantDetailPage needs :merchantId');
  const { detail, isLoading, isFetching, error, refetch, documentUrl } = useAdminMerchant(merchantId);
  const decision = useMerchantDecision();
  const status = useMerchantStatus();
  const { canSee } = useStaffPermissions();
  const isMock = useAdminTransportIsMock();

  useDocumentTitle(detail?.merchant.display_name ?? merchantId, 'Merchants', 'Admin');

  if (isLoading) return <LoadingPage label="Loading merchant" />;

  if (error || !detail) {
    return (
      <PageContainer as="main">
        <PageHeader
          title="Merchant"
          breadcrumbs={[{ label: 'Merchants', to: ADMIN_ROUTES.merchants.index }, { label: merchantId }]}
        />
        <AdminQueryError
          error={error}
          title="We could not load this merchant"
          what="merchants"
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const { merchant, onboarding } = detail;

  return (
    <PageContainer as="main" width="wide">
      <PageHeader
        title={merchant.display_name}
        description={merchant.legal_name}
        isBusy={isFetching}
        breadcrumbs={[
          { label: 'Merchants', to: ADMIN_ROUTES.merchants.index },
          { label: merchant.display_name },
        ]}
      >
        <AdminStatusPill kind="merchant" status={merchant.status} />
        <AdminStatusPill kind="onboarding" status={onboarding.state} />
      </PageHeader>

      <ActionOutcomeAlert outcome={decision.outcome} onDismiss={decision.clearOutcome} />
      <ActionOutcomeAlert outcome={status.outcome} onDismiss={status.clearOutcome} />

      <PageSections>
        <MerchantActions detail={detail} decision={decision} status={status} />

        {onboarding.staff_message ? (
          <Alert tone="info" title="Last message sent to the merchant">
            {onboarding.staff_message}
          </Alert>
        ) : null}

        <div style={{ display: 'grid', gap: space[6], gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
          <Card title="Merchant" headingLevel={2}>
            <DetailList items={merchantItems(detail)} />
          </Card>
          <Card title="Onboarding application" headingLevel={2}>
            <DetailList
              items={[
                { term: 'State', value: <AdminStatusPill kind="onboarding" status={onboarding.state} size="sm" /> },
                { term: 'Submitted', value: <DateCell value={onboarding.submitted_at} absolute /> },
                { term: 'Decided', value: <DateCell value={onboarding.decided_at} absolute /> },
                {
                  term: 'Still missing',
                  value:
                    onboarding.requirements_due.length > 0
                      ? listSentence(onboarding.requirements_due.map((r) => labelise(r)))
                      : 'Nothing — the application is complete',
                },
              ]}
            />
          </Card>
          <Card title="Business profile" headingLevel={2}>
            <DetailList
              items={[
                {
                  term: 'Business type',
                  value: onboarding.business_profile.business_type
                    ? labelise(onboarding.business_profile.business_type)
                    : null,
                },
                { term: 'Website', value: onboarding.business_profile.website },
                { term: 'What they sell', value: onboarding.business_profile.product_description },
                { term: 'Support email', value: onboarding.business_profile.support_email },
                { term: 'Address', value: onboarding.business_profile.address_line1 },
                { term: 'City', value: onboarding.business_profile.city },
                { term: 'Postal code', value: onboarding.business_profile.postal_code },
                { term: 'Registration number', value: onboarding.business_profile.registration_number },
              ]}
            />
          </Card>
          <Card title="Representative" headingLevel={2}>
            <DetailList
              items={[
                { term: 'Full name', value: onboarding.representative.full_name },
                { term: 'Date of birth', value: onboarding.representative.date_of_birth },
                { term: 'Email', value: onboarding.representative.email },
              ]}
            />
          </Card>
        </div>

        <Card title="KYC documents" headingLevel={2} flush>
          <div style={{ padding: space[4] }}>
            <KycDocumentsTable documents={onboarding.documents} documentUrl={documentUrl} isMock={isMock} />
          </div>
        </Card>

        <Card title="Users" headingLevel={2} flush>
          <div style={{ padding: space[4] }}>
            <MerchantUsersTable users={detail.users} canLookUpEmails={canSee('emails')} />
          </div>
        </Card>

        <Card title="Bank accounts" headingLevel={2} flush>
          <div style={{ padding: space[4] }}>
            {detail.bank_accounts ? (
              <BankAccountsTable accounts={detail.bank_accounts} />
            ) : (
              <NotProvided what="bank accounts" />
            )}
          </div>
        </Card>

        <Card title="Balances" headingLevel={2} flush>
          <div style={{ padding: space[4] }}>
            {detail.balances ? <BalancesTable balances={detail.balances} /> : <NotProvided what="balances" />}
          </div>
        </Card>
      </PageSections>
    </PageContainer>
  );
}

function NotProvided({ what }: { what: string }) {
  return (
    <Alert tone="info" title={`No ${what} in this response`}>
      The admin merchant endpoint did not include {what} for this merchant.
    </Alert>
  );
}

function merchantItems(detail: AdminMerchantDetail) {
  const { merchant } = detail;
  return [
    { term: 'Merchant ID', value: <IdCell value={merchant.id} resourceLabel="merchant id" head={14} tail={6} /> },
    { term: 'Legal name', value: merchant.legal_name },
    { term: 'Display name', value: merchant.display_name },
    { term: 'Status', value: <AdminStatusPill kind="merchant" status={merchant.status} size="sm" /> },
    { term: 'Country', value: merchant.country },
    { term: 'Default currency', value: merchant.default_currency },
    { term: 'MCC', value: merchant.mcc },
    { term: 'Risk tier', value: labelise(merchant.risk_tier) },
    { term: 'Payout schedule', value: labelise(merchant.payout_schedule) },
    { term: 'Platform fee', value: formatBps(merchant.platform_fee_bps) },
    { term: 'Created', value: <DateCell value={merchant.created_at} absolute /> },
  ];
}
