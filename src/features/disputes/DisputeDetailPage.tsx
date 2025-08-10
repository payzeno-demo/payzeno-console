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
}
