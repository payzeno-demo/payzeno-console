/**
 * `DisputeDetailPage` — child route of `DisputesPage`.
 *
 * Which evidence form renders is decided by the `dispute_evidence_v2` flag. Both are real
 * components with real submit paths through `useSubmitEvidence`; the flag is the only
 * difference, which is what makes it removable in one line when v2 defaults on.
 */
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Card } from '@components/ui/Card';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
import { useFlag } from '@lib/flags';
import { humanise } from '@lib/format';
import { ROUTES } from '@/routes';

import { EvidenceForm } from './components/EvidenceForm';
import { EvidenceFormV2 } from './components/EvidenceFormV2';
import { formatRemaining } from './disputes.columns';
import { useDispute } from './useDispute';
import { useSubmitEvidence } from './useSubmitEvidence';

export function DisputeDetailPage() {
  const { disputeId = '' } = useParams<{ disputeId: string }>();
  useDocumentTitle(disputeId ? `Dispute ${disputeId}` : 'Dispute');

  const evidenceV2 = useFlag('dispute_evidence_v2');
  const { can } = usePermissions();
  const { dispute, hoursRemaining, windowClosed, canSubmitEvidence, liabilityShifted, isLoading, isMissing, error } =
    useDispute(disputeId);
  const {
    submitEvidence,
    isPending,
    isSubmitted,
    windowClosed: closedOnSubmit,
    errorMessage,
    fieldErrors,
  } = useSubmitEvidence();

  if (isMissing) {
    return <NotFound title="No such dispute" body="It may belong to another account." />;
  }
  if (error) {
    return <ErrorState error={error} title="We could not load this dispute" />;
  }
  if (isLoading || !dispute) {
    return <LoadingPage label="Loading dispute" />;
  }

  const mayRespond = canSubmitEvidence && can('disputes:write') && !closedOnSubmit;
  const onSave = (evidence: Parameters<typeof submitEvidence>[0]['evidence'], submit: boolean) => {
    submitEvidence({ disputeId: dispute.id, evidence, submit });
  };

  return (
    <PageContainer as="main">
      <PageHeader
        title={`Dispute ${dispute.id}`}
        description={`${humanise(dispute.reason)} · network code ${dispute.network_reason_code}`}
      >
        <StatusPill status={dispute.status} label={humanise(dispute.status)} />
      </PageHeader>

      {windowClosed || closedOnSubmit ? (
        <Alert tone="warning" title="The response window has closed">
          The network is deciding this dispute without further evidence.
        </Alert>
      ) : (
        <Alert tone="info" title={`Respond ${formatRemaining(hoursRemaining)}`}>
          Evidence must reach the network before{' '}
          <DateCell value={dispute.evidence_due_by} precision="minute" />.
        </Alert>
      )}

      {liabilityShifted ? (
        <Alert tone="info" title="Liability has shifted to the issuer">
          This charge was authenticated with 3-D Secure and the dispute reason is fraud, so the
          issuer bears the loss. You may still respond, but you are not on the hook for it.
        </Alert>
      ) : null}

      <Card as="section" aria-label="Dispute details">
        <dl>
          <dt>Charge</dt>
          <dd>
            <Link to={ROUTES.charges.detail(dispute.charge_id)}>
              <IdCell value={dispute.charge_id} />
            </Link>
          </dd>

          <dt>Disputed amount</dt>
          <dd>
            <MoneyCell amountMinor={dispute.amount_minor} currency={dispute.currency} />
          </dd>

          <dt>Dispute fee</dt>
          <dd>
            <MoneyCell amountMinor={dispute.fee_minor} currency={dispute.currency} />
          </dd>

          <dt>Refundable</dt>
          <dd>{dispute.is_charge_refundable ? 'Yes' : 'No — the funds are already held'}</dd>

          <dt>Opened</dt>
          <dd>
            <DateCell value={dispute.created_at} precision="minute" />
          </dd>

          <dt>Submitted</dt>
          <dd>
            <DateCell value={dispute.submitted_at} precision="minute" />
          </dd>

          <dt>Resolved</dt>
          <dd>
            <DateCell value={dispute.resolved_at} precision="minute" />
          </dd>
        </dl>
      </Card>

      {evidenceV2 ? (
        <EvidenceFormV2
          disputeId={dispute.id}
          reason={dispute.reason}
          initialEvidence={dispute.evidence}
          disabled={!mayRespond}
          isPending={isPending}
          isSubmitted={isSubmitted}
          errorMessage={errorMessage}
          fieldErrors={fieldErrors}
          onSave={onSave}
        />
      ) : (
        <EvidenceForm
          disputeId={dispute.id}
          initialEvidence={dispute.evidence}
          disabled={!mayRespond}
          isPending={isPending}
          isSubmitted={isSubmitted}
          errorMessage={errorMessage}
          fieldErrors={fieldErrors}
          onSave={onSave}
        />
      )}
    </PageContainer>
  );
}
