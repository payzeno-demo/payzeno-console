/**
 * `OnboardingPage` — `/onboarding` (RFC platform-v2 §3).
 *
 * Everything Payzeno needs before it lets a merchant take live payments, in the order an
 * analyst reads it: the business, the person responsible, where payouts go, proof of
 * identity — then submit. The status banner on top is the page's one source of "where am I".
 *
 * Calls: `GET/PATCH /v1/onboarding`, `POST /v1/onboarding/documents`,
 * `POST /v1/onboarding/submit`, and the existing `GET/POST /v1/bank-accounts` (through the
 * settings feature's hook and dialog, so there is one bank-account form in the console).
 */
import { useState } from 'react';

import type { OnboardingRequirement } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { InlineError } from '@components/feedback/InlineError';
import { StatusPill } from '@components/data/StatusPill';
import { useCurrentMerchant } from '@app/SessionContext';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
import { AddBankAccountDialog } from '@features/settings/components/AddBankAccountDialog';
import { BankAccountTable } from '@features/settings/components/BankAccountTable';
import { useBankAccounts } from '@features/settings/useBankAccounts';

import { BusinessProfileForm } from './components/BusinessProfileForm';
import { KycDocumentsSection } from './components/KycDocumentsSection';
import { OnboardingStatusBanner } from './components/OnboardingStatusBanner';
import { RepresentativeForm } from './components/RepresentativeForm';
import { REQUIREMENT_LABELS, STATE_LABELS } from './onboarding.copy';
import { useOnboarding } from './useOnboarding';
import { useSubmitOnboarding } from './useSubmitOnboarding';
import { useUpdateOnboarding } from './useUpdateOnboarding';
import { useUploadKycDocument } from './useUploadKycDocument';

function StepState({ due }: { due: boolean }) {
  return due ? (
    <Badge tone="warning" size="sm" srPrefix="Step">
      To do
    </Badge>
  ) : (
    <Badge tone="success" size="sm" srPrefix="Step">
      Done
    </Badge>
  );
}

function stepTitle(requirement: OnboardingRequirement, index: number): string {
  return `${index}. ${REQUIREMENT_LABELS[requirement]}`;
}

export function OnboardingPage() {
  useDocumentTitle('Activate your account');

  const merchant = useCurrentMerchant();
  const { can } = usePermissions();
  const [addBankOpen, setAddBankOpen] = useState(false);

  const {
    onboarding,
    editable: stateEditable,
    canSubmit,
    isDue,
    isLoading,
    error,
  } = useOnboarding();
  const profile = useUpdateOnboarding('Business details saved.');
  const representative = useUpdateOnboarding('Representative saved.');
  const documents = useUploadKycDocument();
  const submission = useSubmitOnboarding();
  const { accounts, isLoading: accountsLoading } = useBankAccounts();

  if (error) {
    return (
      <PageContainer as="main">
        <PageHeader title="Activate your account" />
        <ErrorState error={error} title="We could not load your onboarding" />
      </PageContainer>
    );
  }
  if (isLoading || !onboarding) {
    return <LoadingPage label="Loading your onboarding" />;
  }

  // Owners and admins edit; everyone else reads. The api re-checks either way.
  const editable = stateEditable && can('settings:write');

  return (
    <PageContainer as="main">
      <PageHeader
        title="Activate your account"
        description={`${merchant.legal_name} · ${merchant.country}`}
      >
        <StatusPill
          status={onboarding.state}
          srPrefix="Onboarding status"
          label={STATE_LABELS[onboarding.state]}
        />
      </PageHeader>

      <OnboardingStatusBanner onboarding={onboarding} />

      <Card
        title={stepTitle('business_profile', 1)}
        headingLevel={2}
        actions={<StepState due={isDue('business_profile')} />}
      >
        <BusinessProfileForm
          key={JSON.stringify(onboarding.business_profile)}
          profile={onboarding.business_profile}
          editable={editable}
          onSave={profile.save}
          isPending={profile.isPending}
          errorMessage={profile.errorMessage}
          fieldErrors={profile.fieldErrors}
        />
      </Card>

      <Card
        title={stepTitle('representative', 2)}
        headingLevel={2}
        description="The person legally responsible for this account. Usually a director or the owner."
        actions={<StepState due={isDue('representative')} />}
      >
        <RepresentativeForm
          key={JSON.stringify(onboarding.representative)}
          representative={onboarding.representative}
          editable={editable}
          onSave={representative.save}
          isPending={representative.isPending}
          errorMessage={representative.errorMessage}
          fieldErrors={representative.fieldErrors}
        />
      </Card>

      <Card
        title={stepTitle('bank_account', 3)}
        headingLevel={2}
        description="Where payouts go. Account details go straight to our vault; Payzeno never sees the number."
        actions={<StepState due={isDue('bank_account')} />}
      >
        <BankAccountTable
          rows={accounts}
          isLoading={accountsLoading}
          canManage={false}
          onMakeDefault={() => undefined}
        />
        {editable ? (
          <Button type="button" variant="secondary" onClick={() => setAddBankOpen(true)}>
            Add bank account
          </Button>
        ) : null}
      </Card>

      <Card
        title={stepTitle('identity_document', 4)}
        headingLevel={2}
        description="A passport or national ID for the representative, plus anything else we ask for."
        actions={<StepState due={isDue('identity_document')} />}
      >
        <KycDocumentsSection
          documents={onboarding.documents}
          editable={editable}
          onUpload={documents.upload}
          isUploading={documents.isPending}
          errorMessage={documents.errorMessage}
        />
      </Card>

      {stateEditable ? (
        <Card title="5. Submit for review" headingLevel={2}>
          {onboarding.requirements_due.length > 0 ? (
            <p data-testid="requirements-due">
              Still to do:{' '}
              {onboarding.requirements_due.map((due) => REQUIREMENT_LABELS[due]).join(', ')}.
            </p>
          ) : (
            <p>Everything is in. Submit and our team will review your application.</p>
          )}
          {submission.errorMessage ? (
            <InlineError id="onboarding-submit-error">{submission.errorMessage}</InlineError>
          ) : null}
          <Button
            type="button"
            disabled={!canSubmit || !editable || submission.isPending}
            onClick={submission.submit}
          >
            {submission.isPending ? 'Submitting…' : 'Submit for review'}
          </Button>
        </Card>
      ) : null}

      <AddBankAccountDialog
        open={addBankOpen}
        onOpenChange={setAddBankOpen}
        defaultCurrency={merchant.default_currency}
        country={merchant.country}
      />
    </PageContainer>
  );
}
