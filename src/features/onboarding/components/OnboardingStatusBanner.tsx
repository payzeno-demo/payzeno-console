/**
 * One banner per onboarding state (RFC platform-v2 §3). `staff_message` is shown verbatim —
 * the analyst wrote it for the merchant, and paraphrasing it is how a "please upload a
 * clearer passport scan" turns into a support ticket.
 */
import type { Onboarding } from '@payzeno/contracts';

import { Alert } from '@components/ui/Alert';
import { formatTimestamp } from '@lib/date';

export interface OnboardingStatusBannerProps {
  onboarding: Onboarding;
}

function StaffMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <blockquote data-testid="staff-message" style={{ margin: 0 }}>
      <p>{message}</p>
    </blockquote>
  );
}

export function OnboardingStatusBanner({ onboarding }: OnboardingStatusBannerProps) {
  switch (onboarding.state) {
    case 'collecting':
      return (
        <Alert tone="info" title="Tell us about your business">
          <p>
            Complete each step below and submit. Until we have verified your business your account
            works in test mode only — live payments are refused.
          </p>
        </Alert>
      );
    case 'submitted':
      return (
        <Alert tone="info" title="We are reviewing your application">
          <p>
            Submitted {formatTimestamp(onboarding.submitted_at)}. Reviews usually take one to two
            business days and we will email you the decision. You can keep using test mode in the
            meantime.
          </p>
        </Alert>
      );
    case 'needs_info':
      return (
        <Alert tone="warning" title="We need a little more information">
          <p>Our team looked at your application and asked for the following:</p>
          <StaffMessage message={onboarding.staff_message} />
          <p>Update the steps below, then submit again.</p>
        </Alert>
      );
    case 'approved':
      return (
        <Alert tone="success" title="Your business is verified">
          <p>
            Approved {formatTimestamp(onboarding.decided_at)}. Live payments and payouts are open.
          </p>
        </Alert>
      );
    case 'rejected':
      return (
        <Alert tone="danger" role="status" title="We could not approve your application">
          <StaffMessage message={onboarding.staff_message} />
          <p>
            Live payments stay unavailable. If you think this is a mistake, reply to the email we
            sent you.
          </p>
        </Alert>
      );
    default:
      return null;
  }
}
